'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, LayoutDashboard, Building2, Users, Wallet, CalendarCheck, PaintBucket, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils/format'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/obras',         label: 'Obras',         icon: Building2 },
  { href: '/trabalhadores', label: 'Trabalhadores', icon: Users },
  { href: '/folha-diaria',  label: 'Folha Diária',  icon: CalendarCheck },
  { href: '/financeiro',    label: 'Financeiro',    icon: Wallet },
  { href: '/orcamentos',    label: 'Orçamentos',    icon: FileText },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname  = usePathname()
  const { usuario, logout } = useAuthStore()

  return (
    <>
      {/* ── Topbar mobile ──────────────────────────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <PaintBucket className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">VG Pinturas</span>
        </div>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Drawer lateral mobile ──────────────────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          {/* Painel */}
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                <PaintBucket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight">VG Pinturas</p>
                <p className="text-xs text-gray-400 leading-tight">Gestão de Obras</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                const Icon   = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-orange-500' : 'text-gray-400')} />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </Link>
                )
              })}
            </nav>

            {/* Utilizador + Logout */}
            <div className="px-3 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2.5 mb-1 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {usuario ? getInitials(usuario.nome) : '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{usuario?.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom navigation bar (mobile) ────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around px-1 py-1">
          {NAV_ITEMS.map(item => {
            const Icon   = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl flex-1 transition-colors"
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-colors',
                  active ? 'bg-orange-100' : ''
                )}>
                  <Icon className={cn('w-5 h-5', active ? 'text-orange-500' : 'text-gray-400')} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium leading-tight',
                  active ? 'text-orange-600' : 'text-gray-400'
                )}>
                  {item.label === 'Trabalhadores' ? 'Equipa' : item.label === 'Folha Diária' ? 'Folha' : item.label === 'Orçamentos' ? 'Orçam.' : item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Espaço para a bottom bar não cobrir o conteúdo */}
      <div className="lg:hidden h-16" />
    </>
  )
}
