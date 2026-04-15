'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Wallet, LogOut, PaintBucket, CalendarCheck, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils/format'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/obras',         label: 'Obras',          icon: Building2 },
  { href: '/trabalhadores', label: 'Trabalhadores',  icon: Users },
  { href: '/folha-diaria',  label: 'Folha Diária',   icon: CalendarCheck },
  { href: '/financeiro',    label: 'Financeiro',     icon: Wallet },
  { href: '/orcamentos',    label: 'Orçamentos',     icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuario, logout } = useAuthStore()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-orange-500 flex items-center justify-center">
          <PaintBucket className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">VG Pinturas</p>
          <p className="text-xs text-gray-400 truncate leading-tight">Construindo qualidade</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-orange-500' : 'text-gray-400')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {usuario ? getInitials(usuario.nome) : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{usuario?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
