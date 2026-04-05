import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="p-5 bg-gray-100 rounded-full text-gray-400">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-700">{title}</p>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
