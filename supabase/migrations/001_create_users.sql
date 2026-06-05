-- supabase/migrations/001_create_users.sql
-- Tabela de utilizadores autenticados (ID vindo do KindeAuth na Fase 2).
-- Inclui campos para subscrição Stripe (usados na Fase 3).

CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY,          -- ID do KindeAuth
  email               TEXT NOT NULL,
  stripe_customer_id  TEXT,
  plano_atual         TEXT NOT NULL DEFAULT 'free',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
