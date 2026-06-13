// app/api/ingest/route.ts
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { supabase } from "@/lib/supabase";

PDFParse.setWorker(pathToFileURL(getPath()).href);

export async function POST(req: Request) {
  try {
    // 0. Verificar sessão Kinde
    const { getUser, isAuthenticated } = getKindeServerSession();
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autorizado. Por favor inicie sessão." },
        { status: 401 }
      );
    }

    const user = await getUser();
    const userId = user?.id ?? null;

    // 1. Extract the PDF file from multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "É necessário um ficheiro PDF válido." },
        { status: 400 }
      );
    }

    // 2. Convert File → Buffer and parse text with pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do PDF. O ficheiro pode ser uma imagem digitalizada." },
        { status: 422 }
      );
    }

    // 3. Split into overlapping chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text], [
      // Attach the filename as metadata on every chunk
      { source: file.name },
    ]);

    // 4. Embed chunks and store in Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const namespace = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");

    await PineconeStore.fromDocuments(chunks, embeddings, {
      pineconeIndex,
      namespace,
    });

    // 4.5. Garantir que o utilizador existe na tabela users do Supabase
    if (userId) {
      const { error: userErr } = await supabase
        .from("users")
        .upsert({
          id: userId,
          email: user?.email || "",
        }, { onConflict: "id" });

      if (userErr) {
        console.error("[ingest] Erro ao garantir utilizador no Supabase:", userErr.message);
      }
    }

    // 5. Persistir metadados do documento no Supabase com user_id real
    const { data: docRecord, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        pinecone_namespace: namespace,
        nome_ficheiro: file.name,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[ingest] Erro ao guardar metadados no Supabase:", dbError.message);
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunkCount: chunks.length,
      namespace,
      docId: docRecord?.id ?? null,
    });

  } catch (err) {
    console.error("[ingest] error:", err);
    return NextResponse.json(
      { error: "Falha na ingestão. Verifique os logs do servidor." },
      { status: 500 }
    );
  }
}