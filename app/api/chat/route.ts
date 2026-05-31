// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "@langchain/classic/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// Shape of each message the frontend sends
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  namespace: string; // from the ingest response
}

/** Vague / holistic questions need more diverse chunks than a single fact lookup. */
function isBroadQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return /\b(summary|summarize|summarise|overview|outline|resumo|resumir|resuma|visão geral|sinopse|tema(s)?|tópicos?|conteúdo|about this (file|document|pdf)|deste (ficheiro|documento|pdf)|do documento|o que trata|do que fala|em que consiste)\b/i.test(
    q
  );
}

export async function POST(req: Request) {
  try {
    const { messages, namespace } = (await req.json()) as ChatRequest;

    if (!messages?.length || !namespace) {
      return NextResponse.json(
        { error: "messages and namespace are required." },
        { status: 400 }
      );
    }

    // 1. Separate the current question from conversation history
    const history = messages.slice(0, -1);
    const currentQuestion = messages.at(-1)!.content;

    // 2. Connect to the same Pinecone namespace used during ingest
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
    });

    const broad = isBroadQuestion(currentQuestion);
    const retriever = vectorStore.asRetriever(
      broad
        ? {
            k: 12,
            searchType: "mmr",
            searchKwargs: { fetchK: 28, lambda: 0.6 },
          }
        : { k: 6 }
    );

    // 3. The LLM used for both retrieval rephrasing and final answer
    const llm = new ChatOpenAI({
      model: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY!,
      streaming: true,
    });

    // 4. History-aware retriever:
    //    Rephrases follow-up questions into standalone questions
    //    before hitting Pinecone, so context from prior turns isn't lost.
    //    e.g. "What did it say about that?" → "What did the document say about X?"
    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      [
        "human",
        `Given the conversation above, rewrite the user's message into ONE standalone search query for a document retriever.

Rules:
- Use the same language as the user's message (e.g. Portuguese if they wrote in Portuguese).
- Do not answer the question — output only the rewritten query.
- If the user asks for a summary, overview, or "what is this document about", rewrite into a query that would match introductory or definitional passages (main topics, objectives, definitions, key concepts).
- If the message is already a clear, specific question, return it unchanged.`,
      ],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm,
      retriever,
      rephrasePrompt: historyAwarePrompt,
    });

    // 5. The answer prompt — instructs the model to cite sources and stay grounded
    const answerPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful assistant for a single uploaded document. Use the excerpts below as your only source of facts.

Rules:
- Answer in the same language as the user's latest message.
- Base your answer on the excerpts. You may combine and paraphrase across multiple excerpts when the user asks for a summary, overview, or broad explanation.
- For summaries: describe the main topics, goals, and ideas covered in the excerpts even if no excerpt is titled "summary". Do not refuse just because the word "summary" does not appear.
- If excerpts only partially cover the question, answer with what is supported and briefly note what is missing.
- Only if none of the excerpts relate to the question at all, say you could not find relevant material in the retrieved passages (and suggest a more specific question).
- Do not invent facts, citations, or page numbers that are not supported by the excerpts.
- Prefer clear, structured answers; use short paragraphs or bullet points when helpful.

Context excerpts:
{context}`,
      ],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    // 6. Chain: retriever → stuff docs into prompt → LLM answer
    const documentChain = await createStuffDocumentsChain({
      llm,
      prompt: answerPrompt,
    });

    // Do not use createRetrievalChain with a history-aware retriever: it mis-detects
    // any Runnable with `.invoke` as a base retriever and passes only a string query,
    // which breaks embedding (undefined.replace in OpenAIEmbeddings.embedQuery).
    const retrievalChain = RunnableSequence.from([
      RunnablePassthrough.assign({
        context: historyAwareRetriever,
        chat_history: (input) => input.chat_history ?? [],
      }),
      RunnablePassthrough.assign({ answer: documentChain }),
    ]);

    // 7. Convert frontend message history to LangChain message objects
    const chatHistory = history.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    );

    // 8. Stream the response back to the client
    const stream = await retrievalChain.stream({
      input: currentQuestion,
      chat_history: chatHistory,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          // retrievalChain streams several event types — we only want the answer text
          if (chunk.answer) {
            controller.enqueue(encoder.encode(chunk.answer));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json(
      { error: "Chat failed. Check server logs." },
      { status: 500 }
    );
  }
}