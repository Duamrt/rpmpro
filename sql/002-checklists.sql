-- =============================================
-- RPM Pro — Checklists de Entrada e Saida
-- Rodar no Supabase SQL Editor
-- =============================================

-- 1. CHECKLIST DE ENTRADA
CREATE TABLE checklists_entrada (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  itens JSONB NOT NULL DEFAULT '{}',
  fotos TEXT[] DEFAULT '{}',
  observacoes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CHECKLIST DE SAIDA
CREATE TABLE checklists_saida (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  itens JSONB NOT NULL DEFAULT '{}',
  observacoes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDICES
-- =============================================
CREATE INDEX idx_checklist_entrada_os ON checklists_entrada(os_id);
CREATE INDEX idx_checklist_entrada_oficina ON checklists_entrada(oficina_id);
CREATE INDEX idx_checklist_saida_os ON checklists_saida(os_id);
CREATE INDEX idx_checklist_saida_oficina ON checklists_saida(oficina_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE checklists_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists_saida ENABLE ROW LEVEL SECURITY;

-- CHECKLIST ENTRADA
CREATE POLICY "checklist_entrada_select" ON checklists_entrada FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_entrada_insert" ON checklists_entrada FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_entrada_update" ON checklists_entrada FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_entrada_delete" ON checklists_entrada FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- CHECKLIST SAIDA
CREATE POLICY "checklist_saida_select" ON checklists_saida FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_saida_insert" ON checklists_saida FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_saida_update" ON checklists_saida FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "checklist_saida_delete" ON checklists_saida FOR DELETE
  USING (oficina_id = auth_oficina_id());
