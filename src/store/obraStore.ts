'use client'

import { create } from 'zustand'
import type { Obra, ObraFormData } from '@/types'
import * as svc from '@/services/obraService'

interface ObraStore {
  obras:       Obra[]
  loading:     boolean
  initialized: boolean
  init:        () => Promise<void>
  addObra:     (data: ObraFormData) => Promise<Obra>
  updateObra:  (id: string, data: Partial<ObraFormData>) => Promise<void>
  deleteObra:  (id: string) => Promise<void>
  getById:     (id: string) => Obra | undefined
  vincularTrabalhador:    (obraId: string, trabId: string) => Promise<void>
  desvincularTrabalhador: (obraId: string, trabId: string) => Promise<void>
}

export const useObraStore = create<ObraStore>((set, get) => ({
  obras:       [],
  loading:     false,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const obras = await svc.fetchObras()
      set({ obras, initialized: true })
    } finally {
      set({ loading: false })
    }
  },

  addObra: async (data) => {
    const obra = await svc.createObra(data)
    set(s => ({ obras: [obra, ...s.obras] }))
    return obra
  },

  updateObra: async (id, data) => {
    const updated = await svc.updateObra(id, data)
    set(s => ({ obras: s.obras.map(o => o.id === id ? updated : o) }))
  },

  deleteObra: async (id) => {
    await svc.deleteObra(id)
    set(s => ({ obras: s.obras.filter(o => o.id !== id) }))
  },

  getById: (id) => get().obras.find(o => o.id === id),

  vincularTrabalhador: async (obraId, trabId) => {
    await svc.vincularTrabalhador(obraId, trabId)
    set(s => ({
      obras: s.obras.map(o =>
        o.id === obraId && !o.trabalhadoresIds.includes(trabId)
          ? { ...o, trabalhadoresIds: [...o.trabalhadoresIds, trabId] }
          : o
      ),
    }))
  },

  desvincularTrabalhador: async (obraId, trabId) => {
    await svc.desvincularTrabalhador(obraId, trabId)
    set(s => ({
      obras: s.obras.map(o =>
        o.id === obraId
          ? { ...o, trabalhadoresIds: o.trabalhadoresIds.filter(id => id !== trabId) }
          : o
      ),
    }))
  },
}))
