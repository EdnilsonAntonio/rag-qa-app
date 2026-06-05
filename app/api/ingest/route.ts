// app/api/ingest/route.ts
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";
import { supabase } from "@/lib/supabase";

PDFParse.setWorker(pathToFileURL(getPath()).href);

export async function POST(req: Request) {
  try {
    // 1. Extract the PDF file from multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "A valid PDF file is required." },
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
        { error: "Could not extract text from PDF. It may be a scanned image." },
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

    // 5. Persistir metadados do documento no Supabase
    // user_id é null nesta fase — será preenchido na Fase 2 (KindeAuth)
    const { data: docRecord, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: null,
        pinecone_namespace: namespace,
        nome_ficheiro: file.name,
      })
      .select("id")
      .single();

    if (dbError) {
      // Erro não-crítico: a vectorização já foi feita. Registamos mas não falhamos.
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
      { error: "Ingestion failed. Check server logs." },
      { status: 500 }
    );
  }
}