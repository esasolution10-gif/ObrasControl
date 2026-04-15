'use client'

import { use } from 'react'
import { useOrcamentoStore } from '@/store/orcamentoStore'
import OrcamentoForm from '../../_components/OrcamentoForm'

export default function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }      = use(params)
  const getById     = useOrcamentoStore(s => s.getById)
  const loading     = useOrcamentoStore(s => s.loading)
  const initialized = useOrcamentoStore(s => s.initialized)
  const orcamento   = getById(id)

  if (!initialized || loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <p className="text-gray-500 font-medium">Orçamento não encontrado.</p>
      </div>
    )
  }

  return <OrcamentoForm orcamento={orcamento} />
}
