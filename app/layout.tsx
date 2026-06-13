import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAG·QA — Chat with your PDFs using RAG",
  description:
    "Upload PDFs, ask questions, and get cited answers powered by LangChain, OpenAI, and Pinecone.",
  openGraph: {
    title: "RAG·QA",
    description: "Chat with your PDF documents using retrieval-augmented generation",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <KindeProvider>
          {children}
        </KindeProvider>
      </body>
    </html>
  );
}
