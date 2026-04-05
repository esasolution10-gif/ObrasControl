import { supabase } from '@/lib/supabase'
import type { LancamentoFinanceiro, LancamentoFormData } from '@/types'

function mapLancamento(row: Record<string, any>): LancamentoFinanceiro {
  return {
    id:            row.id,
    obraId:        row.obra_id,
    tipo:          row.tipo,
    categoria:     row.categoria,
    descricao:     row.descricao,
    valor:         row.valor,
    data:          row.data,
    trabalhadorId: row.trabalhador_id ?? null,
    observacoes:   row.observacoes ?? '',
    criadoEm:      row.criado_em,
  }
}

export async function fetchLancamentos(): Promise<LancamentoFinanceiro[]> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapLancamento)
}

export async function createLancamento(form: LancamentoFormData): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .insert({
      obra_id:        form.obraId,
      tipo:           form.tipo,
      categoria:      form.categoria,
      descricao:      form.descricao,
      valor:          form.valor,
      data:           form.data,
      trabalhador_id: form.trabalhadorId,
      observacoes:    form.observacoes,
    })
    .select()
    .single()
  if (error) throw error
  return mapLancamento(data)
}

export async function updateLancamento(id: string, form: Partial<LancamentoFormData>): Promise<LancamentoFinanceiro> {
  const patch: Record<string, any> = {}
  if (form.tipo          !== undefined) patch.tipo           = form.tipo
  if (form.categoria     !== undefined) patch.categoria      = form.categoria
  if (form.descricao     !== undefined) patch.descricao      = form.descricao
  if (form.valor         !== undefined) patch.valor          = form.valor
  if (form.data          !== undefined) patch.data           = form.data
  if (form.trabalhadorId !== undefined) patch.trabalhador_id = form.trabalhadorId
  if (form.observacoes   !== undefined) patch.observacoes    = form.observacoes

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapLancamento(data)
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id)
  if (error) throw error
}
