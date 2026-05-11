-- ============================================================
-- FIX: Políticas RLS para usuários internos (anon role)
-- Usuários do app_users não têm sessão Supabase Auth,
-- então fazem queries como 'anon'. Precisam de acesso.
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- kanban_columns
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_kanban_columns" ON kanban_columns;
DROP POLICY IF EXISTS "anon_insert_kanban_columns" ON kanban_columns;
DROP POLICY IF EXISTS "anon_update_kanban_columns" ON kanban_columns;
DROP POLICY IF EXISTS "anon_delete_kanban_columns" ON kanban_columns;

CREATE POLICY "anon_select_kanban_columns" ON kanban_columns
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_kanban_columns" ON kanban_columns
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_kanban_columns" ON kanban_columns
  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_delete_kanban_columns" ON kanban_columns
  FOR DELETE TO anon USING (true);

-- -------------------------------------------------------
-- service_orders
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_service_orders" ON service_orders;
DROP POLICY IF EXISTS "anon_update_service_orders" ON service_orders;

CREATE POLICY "anon_select_service_orders" ON service_orders
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_service_orders" ON service_orders
  FOR UPDATE TO anon USING (true);

-- -------------------------------------------------------
-- customers (para info nas OS)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_customers" ON customers;

CREATE POLICY "anon_select_customers" ON customers
  FOR SELECT TO anon USING (true);

-- -------------------------------------------------------
-- technicians
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_technicians" ON technicians;

CREATE POLICY "anon_select_technicians" ON technicians
  FOR SELECT TO anon USING (true);

-- -------------------------------------------------------
-- files (fotos/videos da OS)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_files" ON files;

CREATE POLICY "anon_select_files" ON files
  FOR SELECT TO anon USING (true);

-- -------------------------------------------------------
-- os_logs
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_all_os_logs" ON os_logs;

CREATE POLICY "anon_all_os_logs" ON os_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- brands (leitura)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_brands" ON brands;
CREATE POLICY "anon_select_brands" ON brands FOR SELECT TO anon USING (true);
