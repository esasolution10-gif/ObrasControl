'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, LayoutDashboard, Building2, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils/format'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/obras',         label: 'Obras',         icon: Building2 },
  { href: '/trabalhadores', label: 'Trabalhadores', icon: Users },
  { href: '/financeiro',    label: 'Financeiro',    icon: Wallet },
]

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { usuario, logout } = useAuthStore()

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/logo.png" alt="VG Pinturas" fill className="object-contain" />
          </div>
          <span className="font-bold text-gray-900 text-sm">{title ?? 'VG Pinturas'}</span>
        </div>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src="/logo.png" alt="VG Pinturas" fill className="object-contain" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">VG Pinturas</p>
                <p className="text-xs text-gray-400">Gestão de Obras</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', active ? 'text-orange-500' : 'text-gray-400')} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 py-4 border-t">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                  {usuario ? getInitials(usuario.nome) : '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{usuario?.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
