-- RPM Pro — Catálogo de Serviços por Oficina
CREATE TABLE IF NOT EXISTS servicos_catalogo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  valor_padrao NUMERIC(12,2) DEFAULT 0,
  tempo_estimado INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicos_cat_oficina ON servicos_catalogo(oficina_id);
CREATE INDEX IF NOT EXISTS idx_servicos_cat_nome ON servicos_catalogo(oficina_id, nome);

ALTER TABLE servicos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicos_cat_select" ON servicos_catalogo FOR SELECT
  USING (oficina_id = auth_oficina_id() OR is_platform_admin());
CREATE POLICY "servicos_cat_insert" ON servicos_catalogo FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());
CREATE POLICY "servicos_cat_update" ON servicos_catalogo FOR UPDATE
  USING (oficina_id = auth_oficina_id());
CREATE POLICY "servicos_cat_delete" ON servicos_catalogo FOR DELETE
  USING (oficina_id = auth_oficina_id());
