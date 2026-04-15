import { supabase }          from '@/lib/supabase'
import {
  Orcamento,
  ItemOrcamento,
  OrcamentoFormData,
  StatusOrcamento,
} from '@/types/orcamento'

// ── Mappers ────────────────────────────────────────────────────────────────

function mapItem(row: Record<string, unknown>): ItemOrcamento {
  return {
    id:            row.id            as string,
    orcamentoId:   row.orcamento_id  as string,
    ordem:         row.ordem         as number,
    descricao:     row.descricao     as string,
    quantidade:    Number(row.quantidade),
    unidade:       row.unidade       as string,
    precoUnitario: Number(row.preco_unitario),
    descontoItem:  Number(row.desconto_item),
    total:         Number(row.total),
  }
}

function mapOrcamento(
  row:   Record<string, unknown>,
  itens: ItemOrcamento[],
): Orcamento {
  return {
    id:                     row.id            as string,
    numero:                 row.numero        as string,
    status:                 row.status        as StatusOrcamento,
    clienteNome:            row.cliente_nome  as string,
    clienteTelefone:        (row.cliente_telefone  as string | null)  ?? undefined,
    clienteEmail:           (row.cliente_email     as string | null)  ?? undefined,
    clienteNif:             (row.cliente_nif       as string | null)  ?? undefined,
    clienteMorada:          (row.cliente_morada    as string | null)  ?? undefined,
    clienteCidade:          (row.cliente_cidade    as string | null)  ?? undefined,
    obraId:                 (row.obra_id           as string | null)  ?? undefined,
    obraReferencia:         (row.obra_referencia   as string | null)  ?? undefined,
    obraLocalidade:         (row.obra_localidade   as string | null)  ?? undefined,
    descricaoServico:       (row.descricao_servico as string | null)  ?? undefined,
    itens,
    descontoValor:          Number(row.desconto_valor),
    descontoPercentual:     Number(row.desconto_percentual),
    usarDescontoPercentual: row.usar_desconto_percentual as boolean,
    impostosPercentual:     Number(row.impostos_percentual),
    subtotal:               Number(row.subtotal),
    total:                  Number(row.total),
    prazoExecucao:          (row.prazo_execucao      as string | null) ?? undefined,
    validadeData:           row.validade_data         as string,
    condicoesPagamento:     (row.condicoes_pagamento  as string | null) ?? undefined,
    observacoes:            (row.observacoes          as string | null) ?? undefined,
    notasInternas:          (row.notas_internas       as string | null) ?? undefined,
    criadoEm:               row.criado_em             as string,
    atualizadoEm:           row.atualizado_em         as string,
  }
}

// ── Fetch all ──────────────────────────────────────────────────────────────

export async function fetchOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, orcamento_itens(*)')
    .order('criado_em', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(row => {
    const itens = ((row.orcamento_itens ?? []) as Record<string, unknown>[])
      .map(mapItem)
      .sort((a, b) => a.ordem - b.ordem)
    return mapOrcamento(row as Record<string, unknown>, itens)
  })
}

// ── Fetch one ──────────────────────────────────────────────────────────────

export async function fetchOrcamento(id: string): Promise<Orcamento> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, orcamento_itens(*)')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  const itens = ((data.orcamento_itens ?? []) as Record<string, unknown>[])
    .map(mapItem)
    .sort((a, b) => a.ordem - b.ordem)
  return mapOrcamento(data as Record<string, unknown>, itens)
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createOrcamento(
  data:   OrcamentoFormData,
  numero: string,
  resumo: { subtotal: number; total: number },
): Promise<Orcamento> {
  const { itens, ...rest } = data

  const { data: row, error } = await supabase
    .from('orcamentos')
    .insert({
      numero,
      status:                   rest.status,
      cliente_nome:             rest.clienteNome,
      cliente_telefone:         rest.clienteTelefone  || null,
      cliente_email:            rest.clienteEmail     || null,
      cliente_nif:              rest.clienteNif       || null,
      cliente_morada:           rest.clienteMorada    || null,
      cliente_cidade:           rest.clienteCidade    || null,
      obra_id:                  rest.obraId           || null,
      obra_referencia:          rest.obraReferencia   || null,
      obra_localidade:          rest.obraLocalidade   || null,
      descricao_servico:        rest.descricaoServico || null,
      desconto_valor:           rest.descontoValor,
      desconto_percentual:      rest.descontoPercentual,
      usar_desconto_percentual: rest.usarDescontoPercentual,
      impostos_percentual:      rest.impostosPercentual,
      subtotal:                 resumo.subtotal,
      total:                    resumo.total,
      prazo_execucao:           rest.prazoExecucao        || null,
      validade_data:            rest.validadeData,
      condicoes_pagamento:      rest.condicoesPagamento   || null,
      observacoes:              rest.observacoes          || null,
      notas_internas:           rest.notasInternas        || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Inserir itens
  if (itens.length > 0) {
    const { error: itensErr } = await supabase
      .from('orcamento_itens')
      .insert(
        itens.map((item, idx) => ({
          orcamento_id:   row.id,
          ordem:          idx,
          descricao:      item.descricao,
          quantidade:     item.quantidade,
          unidade:        item.unidade,
          preco_unitario: item.precoUnitario,
          desconto_item:  item.descontoItem,
          total: Math.max(0, item.quantidade * item.precoUnitario * (1 - item.descontoItem / 100)),
        })),
      )
    if (itensErr) throw new Error(itensErr.message)
  }

  return fetchOrcamento(row.id)
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateOrcamento(
  id:     string,
  data:   Partial<OrcamentoFormData>,
  resumo: { subtotal: number; total: number },
): Promise<Orcamento> {
  const { itens, ...rest } = data

  const payload: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
    subtotal:      resumo.subtotal,
    total:         resumo.total,
  }

  if (rest.status            !== undefined) payload.status                    = rest.status
  if (rest.clienteNome       !== undefined) payload.cliente_nome              = rest.clienteNome
  if (rest.clienteTelefone   !== undefined) payload.cliente_telefone          = rest.clienteTelefone  || null
  if (rest.clienteEmail      !== undefined) payload.cliente_email             = rest.clienteEmail     || null
  if (rest.clienteNif        !== undefined) payload.cliente_nif               = rest.clienteNif       || null
  if (rest.clienteMorada     !== undefined) payload.cliente_morada            = rest.clienteMorada    || null
  if (rest.clienteCidade     !== undefined) payload.cliente_cidade            = rest.clienteCidade    || null
  if (rest.obraId            !== undefined) payload.obra_id                   = rest.obraId           || null
  if (rest.obraReferencia    !== undefined) payload.obra_referencia           = rest.obraReferencia   || null
  if (rest.obraLocalidade    !== undefined) payload.obra_localidade           = rest.obraLocalidade   || null
  if (rest.descricaoServico  !== undefined) payload.descricao_servico         = rest.descricaoServico || null
  if (rest.descontoValor          !== undefined) payload.desconto_valor            = rest.descontoValor
  if (rest.descontoPercentual     !== undefined) payload.desconto_percentual       = rest.descontoPercentual
  if (rest.usarDescontoPercentual !== undefined) payload.usar_desconto_percentual  = rest.usarDescontoPercentual
  if (rest.impostosPercentual     !== undefined) payload.impostos_percentual       = rest.impostosPercentual
  if (rest.prazoExecucao     !== undefined) payload.prazo_execucao            = rest.prazoExecucao        || null
  if (rest.validadeData      !== undefined) payload.validade_data             = rest.validadeData
  if (rest.condicoesPagamento !== undefined) payload.condicoes_pagamento      = rest.condicoesPagamento   || null
  if (rest.observacoes       !== undefined) payload.observacoes               = rest.observacoes          || null
  if (rest.notasInternas     !== undefined) payload.notas_internas            = rest.notasInternas        || null

  const { error } = await supabase
    .from('orcamentos')
    .update(payload)
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Substituir itens
  if (itens !== undefined) {
    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)
    if (itens.length > 0) {
      const { error: itensErr } = await supabase
        .from('orcamento_itens')
        .insert(
          itens.map((item, idx) => ({
            orcamento_id:   id,
            ordem:          idx,
            descricao:      item.descricao,
            quantidade:     item.quantidade,
            unidade:        item.unidade,
            preco_unitario: item.precoUnitario,
            desconto_item:  item.descontoItem,
            total: Math.max(0, item.quantidade * item.precoUnitario * (1 - item.descontoItem / 100)),
          })),
        )
      if (itensErr) throw new Error(itensErr.message)
    }
  }

  return fetchOrcamento(id)
}

// ── Update status only ─────────────────────────────────────────────────────

export async function updateStatusOrcamento(
  id:     string,
  status: StatusOrcamento,
): Promise<void> {
  const { error } = await supabase
    .from('orcamentos')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteOrcamento(id: string): Promise<void> {
  const { error } = await supabase.from('orcamentos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Duplicate ──────────────────────────────────────────────────────────────

export async function duplicateOrcamento(
  id:         string,
  novoNumero: string,
): Promise<Orcamento> {
  const orig = await fetchOrcamento(id)

  const formData: OrcamentoFormData = {
    status:                 'rascunho',
    clienteNome:            orig.clienteNome,
    clienteTelefone:        orig.clienteTelefone,
    clienteEmail:           orig.clienteEmail,
    clienteNif:             orig.clienteNif,
    clienteMorada:          orig.clienteMorada,
    clienteCidade:          orig.clienteCidade,
    obraId:                 orig.obraId,
    obraReferencia:         orig.obraReferencia,
    obraLocalidade:         orig.obraLocalidade,
    descricaoServico:       orig.descricaoServico,
    itens:                  orig.itens.map(i => ({
      ordem:         i.ordem,
      descricao:     i.descricao,
      quantidade:    i.quantidade,
      unidade:       i.unidade,
      precoUnitario: i.precoUnitario,
      descontoItem:  i.descontoItem,
    })),
    descontoValor:          orig.descontoValor,
    descontoPercentual:     orig.descontoPercentual,
    usarDescontoPercentual: orig.usarDescontoPercentual,
    impostosPercentual:     orig.impostosPercentual,
    prazoExecucao:          orig.prazoExecucao,
    validadeData:           orig.validadeData,
    condicoesPagamento:     orig.condicoesPagamento,
    observacoes:            orig.observacoes,
    notasInternas:          orig.notasInternas,
  }

  return createOrcamento(formData, novoNumero, {
    subtotal: orig.subtotal,
    total:    orig.total,
  })
}

// ── List numbers (para gerar próximo número) ───────────────────────────────

export async function fetchNumerosOrcamento(): Promise<string[]> {
  const { data } = await supabase.from('orcamentos').select('numero')
  return (data ?? []).map((r: { numero: string }) => r.numero)
}
