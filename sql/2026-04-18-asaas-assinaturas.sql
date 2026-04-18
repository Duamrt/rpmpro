-- =========================================================================
-- Asaas - assinaturas recorrentes (RPM Pro)
-- Criado: 2026-04-18
-- Branch: feat/asaas-pagamento
-- =========================================================================

-- 1. Colunas novas em oficinas
alter table public.oficinas
  add column if not exists status_pagamento text not null default 'trial'
    check (status_pagamento in ('trial','ativo','atrasado','bloqueado','cancelado')),
  add column if not exists dias_atraso integer not null default 0,
  add column if not exists bloqueado_em timestamptz,
  add column if not exists asaas_customer_id text;

create index if not exists idx_oficinas_status_pagamento on public.oficinas(status_pagamento);
create index if not exists idx_oficinas_asaas_customer on public.oficinas(asaas_customer_id);

-- 2. Tabela assinaturas
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  asaas_customer_id text not null,
  asaas_subscription_id text not null unique,
  plano text not null,                      -- essencial, profissional, rede, beta
  valor numeric(10,2) not null,
  ciclo text not null default 'MONTHLY',    -- MONTHLY, YEARLY
  forma_pagamento text not null default 'UNDEFINED', -- CREDIT_CARD, PIX, BOLETO, UNDEFINED
  status text not null default 'ativa'
    check (status in ('ativa','atrasada','suspensa','cancelada')),
  proximo_vencimento date,
  ultimo_pagamento_em timestamptz,
  cartao_ultimos_digitos text,
  cartao_bandeira text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assinaturas_oficina on public.assinaturas(oficina_id);
create index if not exists idx_assinaturas_subscription on public.assinaturas(asaas_subscription_id);
create index if not exists idx_assinaturas_status on public.assinaturas(status);

-- 3. Tabela de eventos Asaas (log webhook, idempotência)
create table if not exists public.asaas_eventos (
  id uuid primary key default gen_random_uuid(),
  asaas_event_id text unique,               -- id do evento no Asaas (idempotência)
  tipo text not null,                       -- PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc
  payment_id text,
  subscription_id text,
  customer_id text,
  payload jsonb not null,
  processado boolean not null default false,
  erro text,
  created_at timestamptz not null default now()
);

create index if not exists idx_asaas_eventos_tipo on public.asaas_eventos(tipo);
create index if not exists idx_asaas_eventos_subscription on public.asaas_eventos(subscription_id);
create index if not exists idx_asaas_eventos_processado on public.asaas_eventos(processado);

-- 4. RLS
alter table public.assinaturas enable row level security;
alter table public.asaas_eventos enable row level security;

-- assinaturas: oficina vê só a sua; DM Stack vê tudo
drop policy if exists "assinaturas_select_own" on public.assinaturas;
create policy "assinaturas_select_own"
  on public.assinaturas for select
  using (
    oficina_id in (select oficina_id from public.profiles where user_id = auth.uid())
    or exists (select 1 from public.profiles where user_id = auth.uid()
               and oficina_id = 'aaaa0001-0000-0000-0000-000000000001')
  );

-- assinaturas: só service_role escreve (Edge Functions)
drop policy if exists "assinaturas_write_service" on public.assinaturas;
create policy "assinaturas_write_service"
  on public.assinaturas for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- asaas_eventos: só service_role
drop policy if exists "asaas_eventos_service" on public.asaas_eventos;
create policy "asaas_eventos_service"
  on public.asaas_eventos for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 5. Trigger updated_at
create or replace function public.trg_assinaturas_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_assinaturas_updated_at on public.assinaturas;
create trigger trg_assinaturas_updated_at
  before update on public.assinaturas
  for each row execute function public.trg_assinaturas_updated_at();

-- 6. Backfill: oficinas existentes -> status_pagamento baseado em trial_ate/ativo
update public.oficinas
set status_pagamento = case
  when ativo is false then 'bloqueado'
  when trial_ate is not null and trial_ate >= current_date then 'trial'
  when plano in ('essencial','profissional','rede','beta') then 'ativo'
  else 'trial'
end
where status_pagamento = 'trial';
