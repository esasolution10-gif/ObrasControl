import { supabase } from '@/lib/supabase'
import type { Trabalhador, TrabalhadorFormData } from '@/types'

function mapTrabalhador(row: Record<string, any>): Trabalhador {
  return {
    id:        row.id,
    nome:      row.nome,
    funcao:    row.funcao,
    telefone:  row.telefone ?? '',
    diaria:    row.diaria ?? null,
    ativo:     row.ativo,
    obrasIds:  (row.obra_trabalhadores ?? []).map((r: any) => r.obra_id),
    criadoEm:  row.criado_em,
  }
}

const SELECT = '*, obra_trabalhadores(obra_id)'

export async function fetchTrabalhadores(): Promise<Trabalhador[]> {
  const { data, error } = await supabase
    .from('trabalhadores')
    .select(SELECT)
    .order('nome', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapTrabalhador)
}

export async function createTrabalhador(form: TrabalhadorFormData): Promise<Trabalhador> {
  const { data, error } = await supabase
    .from('trabalhadores')
    .insert({
      nome:     form.nome,
      funcao:   form.funcao,
      telefone: form.telefone,
      diaria:   form.diaria,
      ativo:    form.ativo,
    })
    .select(SELECT)
    .single()
  if (error) throw error
  return mapTrabalhador(data)
}

export async function updateTrabalhador(id: string, form: Partial<TrabalhadorFormData>): Promise<Trabalhador> {
  const patch: Record<string, any> = {}
  if (form.nome     !== undefined) patch.nome     = form.nome
  if (form.funcao   !== undefined) patch.funcao   = form.funcao
  if (form.telefone !== undefined) patch.telefone = form.telefone
  if (form.diaria   !== undefined) patch.diaria   = form.diaria
  if (form.ativo    !== undefined) patch.ativo    = form.ativo

  const { data, error } = await supabase
    .from('trabalhadores')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return mapTrabalhador(data)
}

export async function deleteTrabalhador(id: string): Promise<void> {
  const { error } = await supabase.from('trabalhadores').delete().eq('id', id)
  if (error) throw error
}
