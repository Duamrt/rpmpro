-- RPM Pro — Compatibilidade peça x veículo
ALTER TABLE pecas ADD COLUMN IF NOT EXISTS compatibilidade JSONB DEFAULT '[]';
-- Formato: [{"marca":"Hyundai","modelos":["HB20","HB20S","Creta"]},{"marca":"Volkswagen","modelos":["Gol","Polo"]}]

CREATE INDEX IF NOT EXISTS idx_pecas_compat ON pecas USING GIN (compatibilidade);
