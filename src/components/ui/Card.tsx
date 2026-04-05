import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  color?: 'orange' | 'green' | 'red' | 'blue' | 'gray'
}

const colorMap = {
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  text: 'text-green-600'  },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      text: 'text-red-600'    },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    text: 'text-blue-600'   },
  gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',    text: 'text-gray-600'   },
}

export function StatCard({ title, value, subtitle, icon, color = 'orange' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={cn('rounded-2xl p-5 flex items-center gap-4', c.bg)}>
      <div className={cn('p-3 rounded-xl', c.icon)}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={cn('text-xl font-bold', c.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
