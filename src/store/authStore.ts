'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

interface AuthStore {
  usuario:     Usuario | null
  isLoggedIn:  boolean
  initialized: boolean
  init:        () => Promise<void>
  login:       (usuario: Usuario) => void
  logout:      () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario:     null,
  isLoggedIn:  false,
  initialized: false,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({
        usuario: {
          id:    session.user.id,
          nome:  session.user.user_metadata?.nome ?? session.user.email ?? 'Usuário',
          email: session.user.email ?? '',
        },
        isLoggedIn:  true,
        initialized: true,
      })
    } else {
      set({ usuario: null, isLoggedIn: false, initialized: true })
    }
  },

  login: (usuario) => set({ usuario, isLoggedIn: true }),

  logout: async () => {
    await supabase.auth.signOut()
    set({ usuario: null, isLoggedIn: false })
  },
}))
