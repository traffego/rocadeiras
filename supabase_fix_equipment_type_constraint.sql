-- ============================================================
-- FIX: Remover constraint rígida de equipment_type
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Remove constraint antiga
ALTER TABLE service_orders
  DROP CONSTRAINT IF EXISTS service_orders_equipment_type_check;

-- 2. Corrigir registros com valor nulo ou vazio (legados)
UPDATE service_orders
  SET equipment_type = 'Não informado'
  WHERE equipment_type IS NULL OR trim(equipment_type) = '';

-- 3. Adicionar constraint flexível (apenas não vazio)
ALTER TABLE service_orders
  ADD CONSTRAINT service_orders_equipment_type_check
  CHECK (equipment_type IS NOT NULL AND trim(equipment_type) != '');
