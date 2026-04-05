'use client'

import Link from 'next/link'
import { Building2, TrendingUp, TrendingDown, Wallet, ArrowRight, Plus } from 'lucide-react'
import { useObraStore } from '@/store/obraStore'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/format'
import { STATUS_OBRA_LABELS } from '@/types'

export default function DashboardPage() {
  const { obras } = useObraStore()
  const { resumoGeral } = useFinanceiroStore()
  const { usuario } = useAuthStore()

  const resumo = resumoGeral()
  const emAndamento = obras.filter(o => o.status === 'em-andamento').length

  const firstNameMap: Record<string, string> = {}
  if (usuario) {
    firstNameMap['nome'] = usuario.nome.split(' ')[0]
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {usuario?.nome.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Aqui está o resumo geral das suas obras.</p>
        </div>
        <Link href="/obras">
          <Button>
            <Plus className="w-4 h-4" />
            Nova Obra
          </Button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Obras"
          value={String(obras.length)}
          subtitle={`${emAndamento} em andamento`}
          icon={<Building2 className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Em Andamento"
          value={String(emAndamento)}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Total Receitas"
          value={formatCurrency(resumo.totalReceitas)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Total Despesas"
          value={formatCurrency(resumo.totalDespesas)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Saldo geral em destaque */}
      <div className={`rounded-2xl p-6 flex items-center justify-between ${resumo.saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${resumo.saldo >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo Geral</p>
            <p className={`text-3xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resumo.saldo)}
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right text-sm text-gray-400">
          <p>Receitas: {formatCurrency(resumo.totalReceitas)}</p>
          <p>Despesas: {formatCurrency(resumo.totalDespesas)}</p>
        </div>
      </div>

      {/* Status das obras */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['planejada', 'em-andamento', 'concluida', 'pausada'] as const).map(status => {
          const count = obras.filter(o => o.status === status).length
          const colors = {
            'planejada':    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
            'em-andamento': { bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-100' },
            'concluida':    { bg: 'bg-green-50',   text: 'text-green-600',  border: 'border-green-100' },
            'pausada':      { bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-100' },
          }
          const c = colors[status]
          return (
            <div key={status} className={`rounded-xl p-4 border ${c.bg} ${c.border} text-center`}>
              <p className={`text-2xl font-bold ${c.text}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{STATUS_OBRA_LABELS[status]}</p>
            </div>
          )
        })}
      </div>

      {/* Lista rápida de obras */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Obras Recentes</h2>
          <Link href="/obras" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {obras.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma obra cadastrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {obras.slice(0, 6).map(obra => {
                const resumoObra = useFinanceiroStore.getState().resumoObra(obra.id)
                return (
                  <Link
                    key={obra.id}
                    href={`/obras/${obra.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{obra.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{obra.localidade} · {formatDate(obra.dataInicio)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <StatusBadge status={obra.status} />
                      <div className="hidden sm:block text-right">
                        <p className={`text-sm font-semibold ${resumoObra.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(resumoObra.saldo)}
                        </p>
                        <p className="text-xs text-gray-400">saldo</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
