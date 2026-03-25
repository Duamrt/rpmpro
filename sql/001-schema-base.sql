-- =============================================
-- RPM Pro — Schema Base (MVP)
-- Multi-tenant por oficina_id + RLS desde o dia 1
-- =============================================

-- 1. OFICINAS (tenants)
CREATE TABLE oficinas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'PE',
  logo_url TEXT,
  plano TEXT DEFAULT 'beta' CHECK (plano IN ('beta','basico','crescimento')),
  ativo BOOLEAN DEFAULT true,
  trial_ate DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (usuarios vinculados a oficina)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  role TEXT DEFAULT 'mecanico' CHECK (role IN ('dono','gerente','mecanico','atendente')),
  comissao_percent NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CLIENTES
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  score TEXT DEFAULT 'ativo' CHECK (score IN ('ativo','risco','inativo','novo')),
  ultima_visita DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VEICULOS
CREATE TABLE veiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  placa TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  cor TEXT,
  km_atual INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDENS DE SERVICO
CREATE TABLE ordens_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  numero SERIAL,
  veiculo_id UUID REFERENCES veiculos(id) NOT NULL,
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  mecanico_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'entrada' CHECK (status IN ('entrada','diagnostico','orcamento','aprovada','execucao','pronto','entregue','cancelada')),
  descricao TEXT,
  diagnostico TEXT,
  km_entrada INTEGER,
  valor_pecas NUMERIC(12,2) DEFAULT 0,
  valor_mao_obra NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) DEFAULT 0,
  desconto NUMERIC(12,2) DEFAULT 0,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro','pix','debito','credito','boleto','pendente')),
  pago BOOLEAN DEFAULT false,
  data_entrada TIMESTAMPTZ DEFAULT now(),
  data_aprovacao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PECAS (estoque)
CREATE TABLE pecas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  marca TEXT,
  quantidade NUMERIC(10,2) DEFAULT 0,
  estoque_minimo NUMERIC(10,2) DEFAULT 0,
  custo NUMERIC(12,2) DEFAULT 0,
  preco_venda NUMERIC(12,2) DEFAULT 0,
  localizacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ITENS DA OS (pecas + servicos)
CREATE TABLE itens_os (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('peca','servico')),
  descricao TEXT NOT NULL,
  peca_id UUID REFERENCES pecas(id),
  quantidade NUMERIC(10,2) DEFAULT 1,
  valor_unitario NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. HISTORICO DE ESTOQUE
CREATE TABLE estoque_movimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  oficina_id UUID REFERENCES oficinas(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES pecas(id) ON DELETE CASCADE NOT NULL,
  os_id UUID REFERENCES ordens_servico(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade NUMERIC(10,2) NOT NULL,
  custo_unitario NUMERIC(12,2),
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDICES
-- =============================================
CREATE INDEX idx_profiles_oficina ON profiles(oficina_id);
CREATE INDEX idx_clientes_oficina ON clientes(oficina_id);
CREATE INDEX idx_clientes_whatsapp ON clientes(oficina_id, whatsapp);
CREATE INDEX idx_veiculos_oficina ON veiculos(oficina_id);
CREATE INDEX idx_veiculos_placa ON veiculos(oficina_id, placa);
CREATE INDEX idx_os_oficina ON ordens_servico(oficina_id);
CREATE INDEX idx_os_status ON ordens_servico(oficina_id, status);
CREATE INDEX idx_os_mecanico ON ordens_servico(oficina_id, mecanico_id);
CREATE INDEX idx_os_data ON ordens_servico(oficina_id, data_entrada);
CREATE INDEX idx_itens_os ON itens_os(os_id);
CREATE INDEX idx_pecas_oficina ON pecas(oficina_id);
CREATE INDEX idx_estoque_mov ON estoque_movimentos(oficina_id, peca_id);

-- =============================================
-- RLS — Restritivo desde o dia 1
-- =============================================
ALTER TABLE oficinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- Funcao helper: pegar oficina_id do usuario logado
CREATE OR REPLACE FUNCTION auth_oficina_id()
RETURNS UUID AS $$
  SELECT oficina_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- OFICINAS: usuario so ve a propria oficina
CREATE POLICY "oficinas_select" ON oficinas FOR SELECT
  USING (id = auth_oficina_id());

CREATE POLICY "oficinas_update" ON oficinas FOR UPDATE
  USING (id = auth_oficina_id());

-- PROFILES: usuario ve colegas da mesma oficina
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (oficina_id = auth_oficina_id());

-- CLIENTES
CREATE POLICY "clientes_select" ON clientes FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "clientes_insert" ON clientes FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "clientes_update" ON clientes FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "clientes_delete" ON clientes FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- VEICULOS
CREATE POLICY "veiculos_select" ON veiculos FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "veiculos_insert" ON veiculos FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "veiculos_update" ON veiculos FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "veiculos_delete" ON veiculos FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- ORDENS DE SERVICO
CREATE POLICY "os_select" ON ordens_servico FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "os_insert" ON ordens_servico FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "os_update" ON ordens_servico FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "os_delete" ON ordens_servico FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- ITENS OS
CREATE POLICY "itens_select" ON itens_os FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "itens_insert" ON itens_os FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "itens_update" ON itens_os FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "itens_delete" ON itens_os FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- PECAS
CREATE POLICY "pecas_select" ON pecas FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "pecas_insert" ON pecas FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());

CREATE POLICY "pecas_update" ON pecas FOR UPDATE
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "pecas_delete" ON pecas FOR DELETE
  USING (oficina_id = auth_oficina_id());

-- ESTOQUE MOVIMENTOS
CREATE POLICY "estoque_select" ON estoque_movimentos FOR SELECT
  USING (oficina_id = auth_oficina_id());

CREATE POLICY "estoque_insert" ON estoque_movimentos FOR INSERT
  WITH CHECK (oficina_id = auth_oficina_id());
