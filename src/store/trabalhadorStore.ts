'use client'

import { create } from 'zustand'
import type { Trabalhador, TrabalhadorFormData } from '@/types'
import * as svc from '@/services/trabalhadorService'

interface TrabalhadorStore {
  trabalhadores: Trabalhador[]
  loading:       boolean
  initialized:   boolean
  init:          () => Promise<void>
  addTrabalhador:    (data: TrabalhadorFormData) => Promise<Trabalhador>
  updateTrabalhador: (id: string, data: Partial<TrabalhadorFormData>) => Promise<void>
  deleteTrabalhador: (id: string) => Promise<void>
  getById:           (id: string) => Trabalhador | undefined
  vincularObra:    (trabId: string, obraId: string) => void
  desvincularObra: (trabId: string, obraId: string) => void
}

export const useTrabalhadorStore = create<TrabalhadorStore>((set, get) => ({
  trabalhadores: [],
  loading:       false,
  initialized:   false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const trabalhadores = await svc.fetchTrabalhadores()
      set({ trabalhadores, initialized: true })
    } finally {
      set({ loading: false })
    }
  },

  addTrabalhador: async (data) => {
    const t = await svc.createTrabalhador(data)
    set(s => ({ trabalhadores: [t, ...s.trabalhadores] }))
    return t
  },

  updateTrabalhador: async (id, data) => {
    const updated = await svc.updateTrabalhador(id, data)
    set(s => ({ trabalhadores: s.trabalhadores.map(t => t.id === id ? updated : t) }))
  },

  deleteTrabalhador: async (id) => {
    await svc.deleteTrabalhador(id)
    set(s => ({ trabalhadores: s.trabalhadores.filter(t => t.id !== id) }))
  },

  getById: (id) => get().trabalhadores.find(t => t.id === id),

  // Atualiza só o estado local — a persistência é feita via obraService.vincularTrabalhador
  vincularObra: (trabId, obraId) =>
    set(s => ({
      trabalhadores: s.trabalhadores.map(t =>
        t.id === trabId && !t.obrasIds.includes(obraId)
          ? { ...t, obrasIds: [...t.obrasIds, obraId] }
          : t
      ),
    })),

  desvincularObra: (trabId, obraId) =>
    set(s => ({
      trabalhadores: s.trabalhadores.map(t =>
        t.id === trabId
          ? { ...t, obrasIds: t.obrasIds.filter(id => id !== obraId) }
          : t
      ),
    })),
}))
