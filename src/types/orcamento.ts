// ─────────────────────────────────────────────
// Orçamentos — tipos e constantes
// ─────────────────────────────────────────────

export type StatusOrcamento =
  | 'rascunho'
  | 'enviado'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'

export const STATUS_ORCAMENTO_LABELS: Record<StatusOrcamento, string> = {
  rascunho:  'Rascunho',
  enviado:   'Enviado',
  aprovado:  'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
}

export const STATUS_ORCAMENTO_COLORS: Record<StatusOrcamento, string> = {
  rascunho:  'bg-gray-100 text-gray-600',
  enviado:   'bg-blue-100 text-blue-700',
  aprovado:  'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-700',
  cancelado: 'bg-orange-100 text-orange-700',
}

export const UNIDADES_ITEM = [
  'un', 'm²', 'm', 'dia', 'hora', 'serviço', 'kg', 'lt', 'cx',
] as const

export type UnidadeItem = (typeof UNIDADES_ITEM)[number]

// ── Empresa ────────────────────────────────────────────────────────────────

export interface EmpresaConfig {
  nome:      string
  telefone?: string
  email?:    string
  morada?:   string
  nif?:      string
  logoUrl?:  string
}

// ── Item ───────────────────────────────────────────────────────────────────

export interface ItemOrcamento {
  id:            string
  orcamentoId:   string
  ordem:         number
  descricao:     string
  quantidade:    number
  unidade:       string
  precoUnitario: number
  descontoItem:  number   // percentual 0–100
  total:         number   // calculado
}

/** Versão editável (sem id, orcamentoId e total calculado) */
export interface ItemOrcamentoInput {
  ordem:         number
  descricao:     string
  quantidade:    number
  unidade:       string
  precoUnitario: number
  descontoItem:  number
}

// ── Orçamento ──────────────────────────────────────────────────────────────

export interface Orcamento {
  id:     string
  numero: string
  status: StatusOrcamento

  // Cliente
  clienteNome:      string
  clienteTelefone?: string
  clienteEmail?:    string
  clienteNif?:      string
  clienteMorada?:   string
  clienteCidade?:   string

  // Obra / Serviço
  obraId?:           string
  obraReferencia?:   string
  obraLocalidade?:   string
  descricaoServico?: string

  // Itens
  itens: ItemOrcamento[]

  // Financeiro
  descontoValor:          number
  descontoPercentual:     number
  usarDescontoPercentual: boolean
  impostosPercentual:     number
  subtotal:               number
  total:                  number

  // Condições
  prazoExecucao?:      string
  validadeData:        string   // ISO date YYYY-MM-DD
  condicoesPagamento?: string
  observacoes?:        string
  notasInternas?:      string

  // Metadados
  criadoEm:    string
  atualizadoEm: string
}

export type OrcamentoFormData = Omit<
  Orcamento,
  'id' | 'numero' | 'subtotal' | 'total' | 'criadoEm' | 'atualizadoEm' | 'itens'
> & { itens: ItemOrcamentoInput[] }
