-- ============================================================
-- Módulo de Orçamentos — executar no Supabase SQL Editor
-- ============================================================

-- Tabela principal de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero     text NOT NULL UNIQUE,
  status     text NOT NULL DEFAULT 'rascunho'
             CHECK (status IN ('rascunho','enviado','aprovado','rejeitado','cancelado')),

  -- Cliente
  cliente_nome      text NOT NULL,
  cliente_telefone  text,
  cliente_email     text,
  cliente_nif       text,
  cliente_morada    text,
  cliente_cidade    text,

  -- Obra / Serviço
  obra_id           uuid REFERENCES obras(id) ON DELETE SET NULL,
  obra_referencia   text,
  obra_localidade   text,
  descricao_servico text,

  -- Financeiro
  desconto_valor            numeric(12,2) NOT NULL DEFAULT 0,
  desconto_percentual       numeric(5,2)  NOT NULL DEFAULT 0,
  usar_desconto_percentual  boolean       NOT NULL DEFAULT false,
  impostos_percentual       numeric(5,2)  NOT NULL DEFAULT 0,
  subtotal                  numeric(12,2) NOT NULL DEFAULT 0,
  total                     numeric(12,2) NOT NULL DEFAULT 0,

  -- Condições comerciais
  prazo_execucao      text,
  validade_data       date NOT NULL,
  condicoes_pagamento text,
  observacoes         text,
  notas_internas      text,

  -- Metadados
  criado_em    timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id  uuid REFERENCES orcamentos(id) ON DELETE CASCADE NOT NULL,
  ordem         integer      NOT NULL DEFAULT 0,
  descricao     text         NOT NULL,
  quantidade    numeric(10,3) NOT NULL DEFAULT 1,
  unidade       text         NOT NULL DEFAULT 'un',
  preco_unitario numeric(12,2) NOT NULL DEFAULT 0,
  desconto_item  numeric(5,2)  NOT NULL DEFAULT 0,
  total          numeric(12,2) NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orcamentos_status      ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_criado_em   ON orcamentos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente     ON orcamentos(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orc    ON orcamento_itens(orcamento_id);

-- Row Level Security
ALTER TABLE orcamentos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to orcamentos"
  ON orcamentos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access to orcamento_itens"
  ON orcamento_itens FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
