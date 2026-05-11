-- ============================================================
-- MIGRATION: Logs de movimentação de OS
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS os_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'moved', 'accepted', 'finalized')),
  phase text,
  user_name text NOT NULL,
  user_role text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_os_logs_order_id ON os_logs(service_order_id);

ALTER TABLE os_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on os_logs" ON os_logs
  FOR ALL USING (true) WITH CHECK (true);
