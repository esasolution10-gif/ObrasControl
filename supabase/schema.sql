-- ============================================================
-- ObraControl – Schema Supabase
-- Execute este SQL no editor SQL do painel do Supabase
-- ============================================================

-- Tabela de obras
create table if not exists obras (
  id                     uuid primary key default gen_random_uuid(),
  nome                   text not null,
  localidade             text not null,
  descricao              text not null default '',
  data_inicio            date not null,
  data_previsao_termino  date,
  status                 text not null default 'planejada'
                           check (status in ('planejada','em-andamento','concluida','pausada')),
  observacoes            text not null default '',
  criado_em              timestamptz not null default now()
);

-- Tabela de trabalhadores
create table if not exists trabalhadores (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  funcao     text not null,
  telefone   text not null default '',
  diaria     numeric,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- Vínculo obra ↔ trabalhador (N:N)
create table if not exists obra_trabalhadores (
  obra_id         uuid not null references obras(id) on delete cascade,
  trabalhador_id  uuid not null references trabalhadores(id) on delete cascade,
  primary key (obra_id, trabalhador_id)
);

-- Lançamentos financeiros
create table if not exists lancamentos_financeiros (
  id              uuid primary key default gen_random_uuid(),
  obra_id         uuid not null references obras(id) on delete cascade,
  tipo            text not null check (tipo in ('receita','despesa')),
  categoria       text not null,
  descricao       text not null,
  valor           numeric not null,
  data            date not null,
  trabalhador_id  uuid references trabalhadores(id) on delete set null,
  observacoes     text not null default '',
  criado_em       timestamptz not null default now()
);

-- ============================================================
-- Índices úteis
-- ============================================================
create index if not exists idx_lancamentos_obra  on lancamentos_financeiros(obra_id);
create index if not exists idx_ot_obra           on obra_trabalhadores(obra_id);
create index if not exists idx_ot_trab           on obra_trabalhadores(trabalhador_id);

-- ============================================================
-- Row Level Security (opcional – ative se quiser multi-usuário)
-- Por padrão está desabilitado para simplicidade.
-- ============================================================
-- alter table obras                  enable row level security;
-- alter table trabalhadores          enable row level security;
-- alter table obra_trabalhadores     enable row level security;
-- alter table lancamentos_financeiros enable row level security;
