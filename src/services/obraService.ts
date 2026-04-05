import { supabase } from '@/lib/supabase'
import type { Obra, ObraFormData } from '@/types'

function mapObra(row: Record<string, any>): Obra {
  return {
    id:                   row.id,
    nome:                 row.nome,
    localidade:           row.localidade,
    descricao:            row.descricao ?? '',
    dataInicio:           row.data_inicio,
    dataPrevisaoTermino:  row.data_previsao_termino ?? '',
    status:               row.status,
    observacoes:          row.observacoes ?? '',
    trabalhadoresIds:     (row.obra_trabalhadores ?? []).map((r: any) => r.trabalhador_id),
    criadoEm:             row.criado_em,
  }
}

const SELECT = '*, obra_trabalhadores(trabalhador_id)'

export async function fetchObras(): Promise<Obra[]> {
  const { data, error } = await supabase
    .from('obras')
    .select(SELECT)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapObra)
}

export async function createObra(form: ObraFormData): Promise<Obra> {
  const { data, error } = await supabase
    .from('obras')
    .insert({
      nome:                  form.nome,
      localidade:            form.localidade,
      descricao:             form.descricao,
      data_inicio:           form.dataInicio,
      data_previsao_termino: form.dataPrevisaoTermino || null,
      status:                form.status,
      observacoes:           form.observacoes,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return mapObra(data)
}

export async function updateObra(id: string, form: Partial<ObraFormData>): Promise<Obra> {
  const patch: Record<string, any> = {}
  if (form.nome               !== undefined) patch.nome                  = form.nome
  if (form.localidade         !== undefined) patch.localidade            = form.localidade
  if (form.descricao          !== undefined) patch.descricao             = form.descricao
  if (form.dataInicio         !== undefined) patch.data_inicio           = form.dataInicio
  if (form.dataPrevisaoTermino !== undefined) patch.data_previsao_termino = form.dataPrevisaoTermino || null
  if (form.status             !== undefined) patch.status                = form.status
  if (form.observacoes        !== undefined) patch.observacoes           = form.observacoes

  const { data, error } = await supabase
    .from('obras')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return mapObra(data)
}

export async function deleteObra(id: string): Promise<void> {
  const { error } = await supabase.from('obras').delete().eq('id', id)
  if (error) throw error
}

export async function vincularTrabalhador(obraId: string, trabId: string): Promise<void> {
  const { error } = await supabase
    .from('obra_trabalhadores')
    .upsert({ obra_id: obraId, trabalhador_id: trabId })
  if (error) throw error
}

export async function desvincularTrabalhador(obraId: string, trabId: string): Promise<void> {
  const { error } = await supabase
    .from('obra_trabalhadores')
    .delete()
    .eq('obra_id', obraId)
    .eq('trabalhador_id', trabId)
  if (error) throw error
}
