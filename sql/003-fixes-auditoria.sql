-- =============================================
-- RPM Pro — Fixes de Auditoria (sessão 34)
-- Rodar no Supabase SQL Editor
-- NOTA: maioria já foi rodada manualmente. Rodar novamente é seguro (IF NOT EXISTS / IF EXISTS)
-- =============================================

-- 1. CHECK constraint com aguardando_peca
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN ('entrada','diagnostico','orcamento','aprovada','aguardando_peca','execucao','pronto','entregue','cancelada'));

-- 2. UNIQUE placa por oficina
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'veiculos_placa_unica') THEN
    ALTER TABLE veiculos ADD CONSTRAINT veiculos_placa_unica UNIQUE (oficina_id, placa);
  END IF;
END $$;

-- 3. Colunas de configuração da oficina
ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS valor_hora NUMERIC(12,2) DEFAULT 0;
ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS comissao_padrao NUMERIC(5,2) DEFAULT 0;
ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS margem_padrao NUMERIC(5,2) DEFAULT 30;

-- 4. Desconto na OS
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS desconto NUMERIC(12,2) DEFAULT 0;

-- 5. RPC: Signup atômico
CREATE OR REPLACE FUNCTION criar_oficina_e_dono(
  p_user_id UUID,
  p_email TEXT,
  p_nome_oficina TEXT,
  p_nome_usuario TEXT
) RETURNS JSON AS $$
DECLARE
  v_oficina_id UUID;
BEGIN
  INSERT INTO oficinas (nome, plano, trial_ate)
  VALUES (p_nome_oficina, 'beta', (now() + interval '90 days')::date)
  RETURNING id INTO v_oficina_id;

  INSERT INTO profiles (id, oficina_id, nome, email, role)
  VALUES (p_user_id, v_oficina_id, p_nome_usuario, p_email, 'dono');

  RETURN json_build_object('oficina_id', v_oficina_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Criar membro da equipe (sem login)
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
  INSERT INTO profiles (id, oficina_id, nome, email, telefone, role, comissao_percent, ativo)
  VALUES (gen_random_uuid(), p_oficina_id, p_nome, p_email, p_telefone, p_role, p_comissao, p_ativo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Baixa de estoque atômica
CREATE OR REPLACE FUNCTION baixar_estoque(
  p_peca_id UUID,
  p_quantidade NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_qtd_atual NUMERIC;
BEGIN
  UPDATE pecas SET quantidade = quantidade - p_quantidade
  WHERE id = p_peca_id
  RETURNING quantidade INTO v_qtd_atual;
  RETURN v_qtd_atual;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS: policies faltantes
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (oficina_id = auth_oficina_id());

DROP POLICY IF EXISTS "estoque_update" ON estoque_movimentos;
CREATE POLICY "estoque_update" ON estoque_movimentos FOR UPDATE
  USING (oficina_id = auth_oficina_id());

DROP POLICY IF EXISTS "estoque_delete" ON estoque_movimentos;
CREATE POLICY "estoque_delete" ON estoque_movimentos FOR DELETE
  USING (oficina_id = auth_oficina_id());
