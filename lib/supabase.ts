// lib/supabase.ts
// Cliente Supabase para uso exclusivo em Server Components e API Routes.
// Usa a SUPABASE_SERVICE_ROLE_KEY — nunca exposta ao browser.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // No contexto server-side não precisamos de persistência de sessão
    persistSession: false,
    autoRefreshToken: false,
  },
});
