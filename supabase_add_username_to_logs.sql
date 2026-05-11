-- Adicionar coluna username nos logs
ALTER TABLE os_logs ADD COLUMN IF NOT EXISTS user_username text;
