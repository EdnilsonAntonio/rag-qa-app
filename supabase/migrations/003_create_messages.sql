-- supabase/migrations/003_create_messages.sql
-- Tabela de histórico de conversação.
-- Cada mensagem pertence a um documento e (opcionalmente) a um utilizador.
-- O campo citations é JSONB para armazenar referências aos chunks do Pinecone.

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Evitar erro se o tipo já existir
END $$;

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  role        message_role NOT NULL,
  content     TEXT NOT NULL,
  citations   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para recuperar histórico de um documento rapidamente
CREATE INDEX IF NOT EXISTS idx_messages_doc_id ON messages(doc_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
