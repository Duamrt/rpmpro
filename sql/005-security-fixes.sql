-- =============================================
-- RPM Pro — Security Fixes (Nego auditoria)
-- =============================================

-- ALTA-01: criar_membro_equipe com validação de oficina
CREATE OR REPLACE FUNCTION criar_membro_equipe(
  p_oficina_id UUID,
  p_nome TEXT,
  p_email TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'mecanico',
  p_comissao NUMERIC DEFAULT 0,
  p_ativo BOOLEAN DEFAULT true
) RETURNS void AS $$
BEGIN
  -- Valida que o user pertence a essa oficina
  IF p_oficina_id != auth_oficina_id() THEN
    RAISE EXCEPTION 'Acesso negado: oficina diferente';
  END IF;

  INSERT INTO profiles (id, oficina_id, nome, email, telefone, role, comissao_percent, ativo)
  VALUES (gen_random_uuid(), p_oficina_id, p_nome, p_email, p_telefone, p_role, p_comissao, p_ativo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ALTA-03: profiles UPDATE restrito por role
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (oficina_id = auth_oficina_id())
  WITH CHECK (
    oficina_id = auth_oficina_id()
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('dono','gerente')
      OR id = auth.uid()
    )
  );

-- Oficinas: negar DELETE explicitamente
DROP POLICY IF EXISTS "oficinas_no_delete" ON oficinas;
CREATE POLICY "oficinas_no_delete" ON oficinas FOR DELETE USING (false);

-- Estoque movimentos: negar UPDATE/DELETE (dados de auditoria, nunca editar)
DROP POLICY IF EXISTS "estoque_update" ON estoque_movimentos;
CREATE POLICY "estoque_no_update" ON estoque_movimentos FOR UPDATE USING (false);

DROP POLICY IF EXISTS "estoque_delete" ON estoque_movimentos;
CREATE POLICY "estoque_no_delete" ON estoque_movimentos FOR DELETE USING (false);
