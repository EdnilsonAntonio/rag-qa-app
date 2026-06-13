-- supabase/migrations/004_user_id_not_null.sql
-- Fase 2: Autenticação implementada — user_id passa a ser obrigatório.
-- Pré-condição: base de dados esvaziada (sem registos com user_id = null).

-- Tornar user_id NOT NULL na tabela documents
ALTER TABLE documents
  ALTER COLUMN user_id SET NOT NULL;

-- Tornar user_id NOT NULL na tabela messages
ALTER TABLE messages
  ALTER COLUMN user_id SET NOT NULL;

-- Adicionar índice em documents.user_id para listar documentos por utilizador
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
