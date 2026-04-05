'use client'

import { create } from 'zustand'
import type { LancamentoFinanceiro, LancamentoFormData, ResumoFinanceiro } from '@/types'
import * as svc from '@/services/lancamentoService'

interface FinanceiroStore {
  lancamentos: LancamentoFinanceiro[]
  loading:     boolean
  initialized: boolean
  init:          () => Promise<void>
  addLancamento:    (data: LancamentoFormData) => Promise<void>
  updateLancamento: (id: string, data: Partial<LancamentoFormData>) => Promise<void>
  deleteLancamento: (id: string) => Promise<void>
  getByObra:  (obraId: string) => LancamentoFinanceiro[]
  resumoObra: (obraId: string) => ResumoFinanceiro
  resumoGeral: () => ResumoFinanceiro
}

export const useFinanceiroStore = create<FinanceiroStore>((set, get) => ({
  lancamentos: [],
  loading:     false,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const lancamentos = await svc.fetchLancamentos()
      set({ lancamentos, initialized: true })
    } finally {
      set({ loading: false })
    }
  },

  addLancamento: async (data) => {
    const l = await svc.createLancamento(data)
    set(s => ({ lancamentos: [l, ...s.lancamentos] }))
  },

  updateLancamento: async (id, data) => {
    const updated = await svc.updateLancamento(id, data)
    set(s => ({ lancamentos: s.lancamentos.map(l => l.id === id ? updated : l) }))
  },

  deleteLancamento: async (id) => {
    await svc.deleteLancamento(id)
    set(s => ({ lancamentos: s.lancamentos.filter(l => l.id !== id) }))
  },

  getByObra: (obraId) =>
    get().lancamentos
      .filter(l => l.obraId === obraId)
      .sort((a, b) => b.data.localeCompare(a.data)),

  resumoObra: (obraId) => {
    const lista = get().lancamentos.filter(l => l.obraId === obraId)
    const totalReceitas = lista.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const totalDespesas = lista.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas }
  },

  resumoGeral: () => {
    const lista = get().lancamentos
    const totalReceitas = lista.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const totalDespesas = lista.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas }
  },
}))
