-- RPM Pro — Índices de performance
-- Rodar no Supabase SQL Editor

-- Busca de veículo por placa (upper)
CREATE INDEX IF NOT EXISTS idx_veiculos_placa_upper ON veiculos(oficina_id, upper(placa) text_pattern_ops);

-- OS: filtro por pago + data_entrega (financeiro)
CREATE INDEX IF NOT EXISTS idx_os_oficina_pago_entrega ON ordens_servico(oficina_id, pago, data_entrega);

-- OS: listagem por data de criação
CREATE INDEX IF NOT EXISTS idx_os_oficina_created ON ordens_servico(oficina_id, created_at DESC);

-- Veículos por cliente (join rápido)
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(oficina_id, cliente_id);

-- OS: kanban (status + oficina)
CREATE INDEX IF NOT EXISTS idx_os_oficina_status ON ordens_servico(oficina_id, status);

-- Clientes: busca por nome/whatsapp/cpf
CREATE INDEX IF NOT EXISTS idx_clientes_oficina_nome ON clientes(oficina_id, nome);

-- RPC: devolver estoque (incremento atômico)
CREATE OR REPLACE FUNCTION devolver_estoque(p_peca_id UUID, p_quantidade INT)
RETURNS VOID AS $$
BEGIN
  UPDATE pecas SET quantidade = quantidade + p_quantidade WHERE id = p_peca_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
