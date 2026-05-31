import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RAG·QA — Chat",
  description: "Upload PDFs and ask questions with retrieval-augmented generation",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
