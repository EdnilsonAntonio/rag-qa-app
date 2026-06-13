import type { Metadata } from "next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "RAG·QA — Chat",
  description: "Upload PDFs and ask questions with retrieval-augmented generation",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/api/auth/login");
  }

  const user = await getUser();
  if (user?.id) {
    const { error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        email: user.email || "",
      }, { onConflict: "id" });

    if (error) {
      console.error("[AppLayout] Erro ao sincronizar utilizador com Supabase:", error.message);
    }
  }

  return children;
}
