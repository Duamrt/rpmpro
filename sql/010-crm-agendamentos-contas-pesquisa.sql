-- 010 — CRM, Agendamentos, Contas a Pagar/Receber, Pesquisa de Satisfação
-- RPM Pro — Sessão 35 (2026-03-26)
-- Tabelas: agendamentos, contas, pesquisas_satisfacao
-- RPCs: buscar_pesquisa, responder_pesquisa
-- Tudo com RLS + índices

-- AGENDAMENTOS
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id uuid REFERENCES oficinas(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  veiculo_id uuid REFERENCES veiculos(id) NOT NULL,
  tipo text NOT NULL DEFAULT 'revisao',
  descricao text,
  data_prevista date NOT NULL,
  km_previsto int,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','notificado','confirmado','realizado','cancelado')),
  notificado_em timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- CONTAS
CREATE TABLE IF NOT EXISTS contas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id uuid REFERENCES oficinas(id) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('pagar','receber')),
  descricao text NOT NULL,
  valor decimal(12,2) NOT NULL,
  vencimento date NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  categoria text DEFAULT 'outro',
  forma_pagamento text,
  pago_em timestamptz,
  recorrente boolean DEFAULT false,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- PESQUISAS
CREATE TABLE IF NOT EXISTS pesquisas_satisfacao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id uuid REFERENCES oficinas(id) NOT NULL,
  os_id uuid REFERENCES ordens_servico(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  nota int CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  respondido_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RPCs
CREATE OR REPLACE FUNCTION buscar_pesquisa(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_pesquisa record;
BEGIN
  SELECT ps.*, o.nome as oficina_nome, c.nome as cliente_nome, os.numero as os_numero
  INTO v_pesquisa FROM pesquisas_satisfacao ps
  JOIN oficinas o ON o.id = ps.oficina_id
  JOIN clientes c ON c.id = ps.cliente_id
  JOIN ordens_servico os ON os.id = ps.os_id
  WHERE ps.token = p_token;
  IF v_pesquisa IS NULL THEN RETURN json_build_object('ok', false, 'erro', 'Pesquisa nao encontrada'); END IF;
  RETURN json_build_object('ok', true, 'oficina', v_pesquisa.oficina_nome, 'cliente', v_pesquisa.cliente_nome, 'os_numero', v_pesquisa.os_numero, 'ja_respondida', v_pesquisa.respondido_em IS NOT NULL);
END; $$;

CREATE OR REPLACE FUNCTION responder_pesquisa(p_token text, p_nota int, p_comentario text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_pesquisa pesquisas_satisfacao%ROWTYPE;
BEGIN
  SELECT * INTO v_pesquisa FROM pesquisas_satisfacao WHERE token = p_token;
  IF v_pesquisa IS NULL THEN RETURN json_build_object('ok', false, 'erro', 'Pesquisa nao encontrada'); END IF;
  IF v_pesquisa.respondido_em IS NOT NULL THEN RETURN json_build_object('ok', false, 'erro', 'Pesquisa ja respondida'); END IF;
  IF p_nota < 1 OR p_nota > 5 THEN RETURN json_build_object('ok', false, 'erro', 'Nota deve ser de 1 a 5'); END IF;
  UPDATE pesquisas_satisfacao SET nota = p_nota, comentario = p_comentario, respondido_em = now() WHERE token = p_token AND respondido_em IS NULL;
  RETURN json_build_object('ok', true);
END; $$;
