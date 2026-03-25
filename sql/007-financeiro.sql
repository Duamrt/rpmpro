-- RPM Pro — Financeiro (Caixa)
CREATE TABLE IF NOT EXISTS caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  categoria TEXT NOT NULL CHECK (categoria IN ('servico','peca','despesa','retirada','aporte','outro')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro','pix','debito','credito','boleto','transferencia')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caixa_oficina ON caixa(oficina_id);
CREATE INDEX IF NOT EXISTS idx_caixa_oficina_data ON caixa(oficina_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_caixa_oficina_tipo ON caixa(oficina_id, tipo, created_at);

ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caixa_select" ON caixa;
CREATE POLICY "caixa_select" ON caixa FOR SELECT
  USING (oficina_id = auth_oficina_id() OR is_platform_admin());
DROP POLICY IF EXISTS "caixa_insert" ON caixa;
CREATE POLICY "caixa_insert" ON caixa FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());
DROP POLICY IF EXISTS "caixa_update" ON caixa;
CREATE POLICY "caixa_update" ON caixa FOR UPDATE
  USING (oficina_id = auth_oficina_id());
DROP POLICY IF EXISTS "caixa_delete" ON caixa;
CREATE POLICY "caixa_delete" ON caixa FOR DELETE
  USING (oficina_id = auth_oficina_id());
