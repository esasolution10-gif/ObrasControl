'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useObraStore } from '@/store/obraStore'
import { useTrabalhadorStore } from '@/store/trabalhadorStore'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, initialized, init: authInit } = useAuthStore()
  const router = useRouter()

  const initObras        = useObraStore(s => s.init)
  const initTrabalhador  = useTrabalhadorStore(s => s.init)
  const initFinanceiro   = useFinanceiroStore(s => s.init)

  // Verifica sessão Supabase uma única vez
  useEffect(() => { authInit() }, [authInit])

  // Carrega dados quando autenticado
  useEffect(() => {
    if (isLoggedIn) {
      initObras()
      initTrabalhador()
      initFinanceiro()
    }
  }, [isLoggedIn, initObras, initTrabalhador, initFinanceiro])

  // Redireciona se não autenticado (após checar sessão)
  useEffect(() => {
    if (initialized && !isLoggedIn) router.push('/login')
  }, [initialized, isLoggedIn, router])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
