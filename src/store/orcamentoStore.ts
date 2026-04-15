'use client'

import { create } from 'zustand'
import {
  fetchOrcamentos,
  createOrcamento,
  updateOrcamento,
  deleteOrcamento,
  updateStatusOrcamento,
  duplicateOrcamento,
} from '@/services/orcamentoService'
import { Orcamento, OrcamentoFormData, StatusOrcamento } from '@/types/orcamento'
import { recalcularOrcamento, gerarNumeroOrcamento } from '@/utils/orcamentoCalc'

interface OrcamentoState {
  orcamentos:  Orcamento[]
  loading:     boolean
  initialized: boolean

  init:            () => Promise<void>
  addOrcamento:    (data: OrcamentoFormData) => Promise<Orcamento>
  editOrcamento:   (id: string, data: OrcamentoFormData) => Promise<Orcamento>
  removeOrcamento: (id: string) => Promise<void>
  updateStatus:    (id: string, status: StatusOrcamento) => Promise<void>
  duplicar:        (id: string) => Promise<Orcamento>
  getById:         (id: string) => Orcamento | undefined
}

export const useOrcamentoStore = create<OrcamentoState>((set, get) => ({
  orcamentos:  [],
  loading:     false,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const orcamentos = await fetchOrcamentos()
      set({ orcamentos, initialized: true })
    } finally {
      set({ loading: false })
    }
  },

  addOrcamento: async (data) => {
    const numeros = get().orcamentos.map(o => o.numero)
    const numero  = gerarNumeroOrcamento(numeros)
    const resumo  = recalcularOrcamento(
      data.itens,
      data.descontoValor,
      data.descontoPercentual,
      data.usarDescontoPercentual,
      data.impostosPercentual,
    )
    const novo = await createOrcamento(data, numero, {
      subtotal: resumo.subtotal,
      total:    resumo.total,
    })
    set(s => ({ orcamentos: [novo, ...s.orcamentos] }))
    return novo
  },

  editOrcamento: async (id, data) => {
    const resumo = recalcularOrcamento(
      data.itens,
      data.descontoValor,
      data.descontoPercentual,
      data.usarDescontoPercentual,
      data.impostosPercentual,
    )
    const updated = await updateOrcamento(id, data, {
      subtotal: resumo.subtotal,
      total:    resumo.total,
    })
    set(s => ({
      orcamentos: s.orcamentos.map(o => (o.id === id ? updated : o)),
    }))
    return updated
  },

  removeOrcamento: async (id) => {
    await deleteOrcamento(id)
    set(s => ({ orcamentos: s.orcamentos.filter(o => o.id !== id) }))
  },

  updateStatus: async (id, status) => {
    await updateStatusOrcamento(id, status)
    set(s => ({
      orcamentos: s.orcamentos.map(o => (o.id === id ? { ...o, status } : o)),
    }))
  },

  duplicar: async (id) => {
    const numeros = get().orcamentos.map(o => o.numero)
    const numero  = gerarNumeroOrcamento(numeros)
    const novo    = await duplicateOrcamento(id, numero)
    set(s => ({ orcamentos: [novo, ...s.orcamentos] }))
    return novo
  },

  getById: (id) => get().orcamentos.find(o => o.id === id),
}))
