// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type StatusObra =
  | 'planejada'
  | 'em-andamento'
  | 'concluida'
  | 'pausada'

export type TipoLancamento = 'despesa' | 'receita'

export const STATUS_OBRA_LABELS: Record<StatusObra, string> = {
  'planejada':    'Planejada',
  'em-andamento': 'Em Andamento',
  'concluida':    'Concluída',
  'pausada':      'Pausada',
}

export const STATUS_OBRA_COLORS: Record<StatusObra, string> = {
  'planejada':    'bg-blue-100 text-blue-700',
  'em-andamento': 'bg-orange-100 text-orange-700',
  'concluida':    'bg-green-100 text-green-700',
  'pausada':      'bg-gray-100 text-gray-600',
}

export const CATEGORIAS_DESPESA = [
  'Material',
  'Mão de Obra',
  'Equipamento',
  'Transporte',
  'Alimentação',
  'Impostos e Taxas',
  'Serviços Terceirizados',
  'Outros',
] as const

export const CATEGORIAS_RECEITA = [
  'Adiantamento',
  'Medição',
  'Saldo do Contrato',
  'Outros',
] as const

// ─────────────────────────────────────────────
// Entities
// ─────────────────────────────────────────────

export interface Obra {
  id: string
  nome: string
  localidade: string
  descricao: string
  dataInicio: string       // ISO date string
  dataPrevisaoTermino: string
  status: StatusObra
  observacoes: string
  trabalhadoresIds: string[]
  criadoEm: string
}

export interface Trabalhador {
  id: string
  nome: string
  funcao: string
  telefone: string
  diaria: number | null
  ativo: boolean
  obrasIds: string[]
  criadoEm: string
}

export interface LancamentoFinanceiro {
  id: string
  obraId: string
  tipo: TipoLancamento
  categoria: string
  descricao: string
  valor: number
  data: string
  trabalhadorId: string | null
  observacoes: string
  criadoEm: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
}

// ─────────────────────────────────────────────
// Forms (omit auto-generated fields)
// ─────────────────────────────────────────────

export type ObraFormData = Omit<Obra, 'id' | 'criadoEm' | 'trabalhadoresIds'>
export type TrabalhadorFormData = Omit<Trabalhador, 'id' | 'criadoEm' | 'obrasIds'>
export type LancamentoFormData = Omit<LancamentoFinanceiro, 'id' | 'criadoEm'>

// ─────────────────────────────────────────────
// Financials
// ─────────────────────────────────────────────

export interface ResumoFinanceiro {
  totalReceitas: number
  totalDespesas: number
  saldo: number
}
