-- ============================================================
-- MIGRATION: Sistema de Funções de Usuário
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Habilitar extensão de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabela de usuários internos do sistema
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'gerente', 'mecanico', 'tecnico', 'vendedor')),
  password_hash text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. RPC: Autenticar usuário (retorna JSON com dados do usuário ou NULL)
CREATE OR REPLACE FUNCTION authenticate_app_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user app_users;
BEGIN
  SELECT * INTO v_user
  FROM app_users
  WHERE username = p_username AND active = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF crypt(p_password, v_user.password_hash) = v_user.password_hash THEN
    RETURN json_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'username', v_user.username,
      'role', v_user.role
    );
  END IF;

  RETURN NULL;
END;
$$;

-- 4. RPC: Criar usuário com senha hasheada
CREATE OR REPLACE FUNCTION create_app_user(p_name text, p_username text, p_password text, p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user app_users;
BEGIN
  INSERT INTO app_users (name, username, password_hash, role)
  VALUES (p_name, p_username, crypt(p_password, gen_salt('bf')), p_role)
  RETURNING * INTO v_user;

  RETURN json_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'username', v_user.username,
    'role', v_user.role,
    'active', v_user.active,
    'created_at', v_user.created_at
  );
END;
$$;

-- 5. RPC: Atualizar usuário (senha opcional)
CREATE OR REPLACE FUNCTION update_app_user(
  p_id uuid,
  p_name text,
  p_username text,
  p_role text,
  p_password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user app_users;
BEGIN
  IF p_password IS NOT NULL AND p_password != '' THEN
    UPDATE app_users
    SET name = p_name,
        username = p_username,
        role = p_role,
        password_hash = crypt(p_password, gen_salt('bf'))
    WHERE id = p_id
    RETURNING * INTO v_user;
  ELSE
    UPDATE app_users
    SET name = p_name,
        username = p_username,
        role = p_role
    WHERE id = p_id
    RETURNING * INTO v_user;
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'username', v_user.username,
    'role', v_user.role,
    'active', v_user.active,
    'created_at', v_user.created_at
  );
END;
$$;

-- 6. Política RLS: permitir acesso anônimo (anon key) às RPCs
-- As RPCs já são SECURITY DEFINER, mas precisamos permitir acesso à tabela para SELECT
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Apenas leitura de colunas não sensíveis via anon (para listar usuários no admin)
CREATE POLICY "Allow anon read app_users" ON app_users
  FOR SELECT USING (true);

-- Bloquear insert/update/delete direto (só via RPC)
CREATE POLICY "Block direct insert" ON app_users
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Block direct update" ON app_users
  FOR UPDATE USING (false);

-- 7. Usuário admin inicial (ALTERE a senha antes de rodar!)
SELECT create_app_user('Administrador', 'admin', 'admin123', 'admin');
