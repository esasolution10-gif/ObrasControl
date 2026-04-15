import { ItemOrcamentoInput } from '@/types/orcamento'

// ── Cálculos de item ───────────────────────────────────────────────────────

export function calcItemTotal(
  quantidade:    number,
  precoUnitario: number,
  descontoItem:  number = 0,
): number {
  const bruto = quantidade * precoUnitario
  return Math.max(0, bruto * (1 - descontoItem / 100))
}

// ── Cálculos do orçamento ─────────────────────────────────────────────────

export function calcSubtotal(itens: { total: number }[]): number {
  return itens.reduce((acc, i) => acc + i.total, 0)
}

export function calcValorDesconto(
  subtotal:           number,
  descontoValor:      number,
  descontoPercentual: number,
  usarPercentual:     boolean,
): number {
  if (usarPercentual) return subtotal * (descontoPercentual / 100)
  return Math.min(descontoValor, subtotal)
}

export function calcValorImpostos(base: number, pct: number): number {
  return base * (pct / 100)
}

export function calcTotal(subtotal: number, desconto: number, impostos: number): number {
  return Math.max(0, subtotal - desconto + impostos)
}

export interface ResumoOrcamento {
  subtotal: number
  desconto: number
  impostos: number
  total:    number
}

export function recalcularOrcamento(
  inputs:                 ItemOrcamentoInput[],
  descontoValor:          number,
  descontoPercentual:     number,
  usarDescontoPercentual: boolean,
  impostosPercentual:     number,
): ResumoOrcamento {
  const itensComTotal = inputs.map(i => ({
    total: calcItemTotal(i.quantidade, i.precoUnitario, i.descontoItem),
  }))
  const subtotal = calcSubtotal(itensComTotal)
  const desconto = calcValorDesconto(subtotal, descontoValor, descontoPercentual, usarDescontoPercentual)
  const impostos = calcValorImpostos(subtotal - desconto, impostosPercentual)
  const total    = calcTotal(subtotal, desconto, impostos)
  return { subtotal, desconto, impostos, total }
}

// ── Geração de número ──────────────────────────────────────────────────────

export function gerarNumeroOrcamento(existentes: string[]): string {
  const ano     = new Date().getFullYear()
  const prefixo = `ORC-${ano}-`
  const nums    = existentes
    .filter(n => n.startsWith(prefixo))
    .map(n => parseInt(n.slice(prefixo.length), 10))
    .filter(n => !isNaN(n))
  const proximo = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefixo}${String(proximo).padStart(3, '0')}`
}
