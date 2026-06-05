-- supabase/migrations/002_create_documents.sql
-- Tabela de documentos PDF carregados.
-- Nota: user_id é nullable nesta fase (autenticação ainda não está implementada).
-- Na Fase 2 (KindeAuth) será preenchido com o ID do utilizador autenticado.

CREATE TABLE IF NOT EXISTS documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT REFERENCES users(id) ON DELETE CASCADE,
  pinecone_namespace  TEXT NOT NULL,
  nome_ficheiro       TEXT NOT NULL,
  data_upload         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
