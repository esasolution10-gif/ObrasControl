import { cn } from '@/lib/utils'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, type StatusObra } from '@/types'

interface BadgeProps {
  className?: string
  children: React.ReactNode
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: StatusObra }) {
  return (
    <Badge className={STATUS_OBRA_COLORS[status]}>
      {STATUS_OBRA_LABELS[status]}
    </Badge>
  )
}

export function TipoBadge({ tipo }: { tipo: 'receita' | 'despesa' }) {
  return (
    <Badge className={tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
      {tipo === 'receita' ? 'Receita' : 'Despesa'}
    </Badge>
  )
}
