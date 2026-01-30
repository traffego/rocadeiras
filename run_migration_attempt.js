import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// LEIA-ME:
// 1. Instale as dependencias se precisar: npm install dotenv
// 2. Coloque sua SERVICE_ROLE key abaixo onde diz 'SUA_CHAVE_AQUI'
// 3. Rode com: node run_migration.js
// 4. APAGUE ESSE ARQUIVO DEPOIS!

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jhfbvtmeamejabijjoeo.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || 'SUA_CHAVE_SERVICE_ROLE_AQUI'

if (SERVICE_ROLE_KEY === 'SUA_CHAVE_SERVICE_ROLE_AQUI') {
    console.error('ERRO: Você precisa editar esse arquivo e colocar a SERVICE_ROLE_KEY!')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const sql = `
-- 1. Create table for Kanban Columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Populate with existing hardcoded statuses
INSERT INTO kanban_columns (slug, title, position) VALUES
('received', 'Recebida', 10),
('analysis', 'Análise', 20),
('budget', 'Orçamento', 30),
('washing', 'Lavagem', 40),
('assembly', 'Montagem', 50),
('testing', 'Teste', 60),
('pickup', 'Entrega', 70),
('finished', 'Finalizada', 80)
ON CONFLICT (slug) DO NOTHING;

-- 3. Remove the strict CHECK constraint on service_orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_orders_current_status_check') THEN
    ALTER TABLE service_orders DROP CONSTRAINT service_orders_current_status_check;
  END IF;
END $$;

-- 4. Add FK ensuring status exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_service_orders_status') THEN
    ALTER TABLE service_orders 
    ADD CONSTRAINT fk_service_orders_status 
    FOREIGN KEY (current_status) 
    REFERENCES kanban_columns (slug)
    ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- 6. Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for authenticated users' AND tablename = 'kanban_columns') THEN
    CREATE POLICY "Enable all access for authenticated users" ON kanban_columns
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
`

async function run() {
    console.log('Iniciando migração...')

    // Split commands purely by semicolon might be risky if content has semicolon, 
    // but for this specific script it's fine. 
    // Ideally we use a stored procedure or pg driver, but supabase-js doesn't support raw SQL easily on all tiers 
    // except via rpc if enabled, or REST API doesn't do raw SQL.

    // WAIT! supabase-js client DOES NOT run raw SQL directly unless we use rpc() to a server function that runs SQL.
    // OR if we use the Dashboard.

    // Actually, there isn't a simple "execSql" method in supabase-js client for security reasons.
    // The only way to run DDL (CREATE TABLE) via code is if we have a Postgres connection string (pg library)
    // OR if we have a specific Edge Function set up for it.

    console.log('--- ATENÇÃO ---')
    console.log('O cliente Supabase JS não permite rodar "CREATE TABLE" diretamente por segurança.')
    console.log('Mesmo com a Service Role, a API REST não expõe um endpoint para Raw SQL.')
    console.log('')
    console.log('Para fazer isso via código, você precisaria da "Connection String" do banco (postgres://...)')
    console.log('e usar uma biblioteca como "pg".')
    console.log('')
    console.log('Sério, o jeito mais rápido (10 seg) é copiar e colar no painel SQL do Supabase.')
}

run()
