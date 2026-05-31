# RAG-QA: Document Question-Answering with Retrieval-Augmented Generation

A full-stack application that lets you upload PDFs and chat with them using AI. Ask questions, get cited answers, and discover insights from your documents instantly.

## What It Does

Upload any PDF → the app chunks and embeds it → ask natural language questions → get answers grounded in your document with source citations. Built to teach RAG (Retrieval-Augmented Generation), the most in-demand AI architecture pattern in 2025.

## Key Features

- **Semantic Search**: Upload PDFs, chunk them intelligently, and embed with OpenAI's text-embedding-3-small
- **History-Aware Retrieval**: Follow-up questions are rephrased into standalone queries before retrieval, so context never gets lost
- **Cited Answers**: Every response includes `[1]`, `[2]` references to the source chunks — no hallucinations
- **Multi-Document Support**: Query one document at a time or compare across multiple PDFs using isolated Pinecone namespaces
- **Streaming UI**: Responses stream in real-time with a blinking cursor — no waiting for the full answer
- **Conversation Memory**: The chat remembers prior turns, so you can ask follow-ups like "Tell me more about that" and it understands context

## Tech Stack

**Frontend**: Next.js 14 (App Router) + React + Tailwind CSS  
**Backend**: Next.js API Routes + LangChain.js  
**AI/ML**: OpenAI Embeddings + GPT-4o + LangChain retrieval chains  
**Vector DB**: Pinecone (for semantic search across document chunks)  
**PDF Parsing**: pdf-parse (Node.js)  
**Streaming**: Vercel AI SDK + custom ReadableStream handling

## How It Works (The RAG Pipeline)

1. **Ingest** (`/api/ingest`): PDF → text → split into overlapping chunks → embed each chunk with OpenAI → store vectors + metadata in Pinecone
2. **Retrieve** (`/api/chat`): User question → rephrase using chat history → embed the rephrased question → similarity search in Pinecone for top-4 chunks
3. **Augment & Generate**: Inject retrieved chunks as context into a GPT-4o prompt that's instructed to cite sources → stream response back to frontend

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key ([platform.openai.com](https://platform.openai.com))
- Pinecone account ([pinecone.io](https://pinecone.io)) — free tier included

### Install & Run

```bash
git clone https://github.com/EdnilsonAntonio/rag-qa-app
cd rag-qa
npm install

# Create .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
echo "PINECONE_API_KEY=..." >> .env.local
echo "PINECONE_INDEX_NAME=rag-docs" >> .env.local

# In Pinecone dashboard, create an index named "rag-docs" 
# with 1536 dimensions (text-embedding-3-small size) and cosine metric

npm run dev
# Open http://localhost:3000
```

## Project Goals

This project teaches:

- **RAG Architecture**: How embeddings, vector search, and context injection power modern AI applications
- **LangChain Patterns**: History-aware retrievers, document chains, and multi-turn reasoning
- **Production Skills**: Streaming UX, error handling, multi-user document isolation, API design
- **Interview Readiness**: A portfolio piece you can explain end-to-end, from PDF parsing to LLM prompting

Perfect for developers transitioning into AI engineering roles.

## Advanced Features

- **Document Comparison Mode**: Ask "What does Document A say vs Document B about X?"
- **ATS-Style Scoring** (planned): Rate relevance of retrieved chunks to the query
- **Conversation Export**: Download chat history as markdown with citations

## Deployment

Deploy to [Vercel](https://vercel.com) in one click. The free tier handles this project easily.

```bash
vercel --prod
```

## License

MIT

## Author

Ednilson António

Built as a learning project to master RAG and full-stack AI development.