'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Filter } from 'lucide-react'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { useObraStore } from '@/store/obraStore'
import { useTrabalhadorStore } from '@/store/trabalhadorStore'
import { StatCard } from '@/components/ui/Card'
import { TipoBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils/format'
import type { TipoLancamento } from '@/types'

export default function FinanceiroPage() {
  const { lancamentos, resumoGeral } = useFinanceiroStore()
  const { obras } = useObraStore()
  const { trabalhadores } = useTrabalhadorStore()

  const [filtroTipo, setFiltroTipo]   = useState<'' | TipoLancamento>('')
  const [filtroObra, setFiltroObra]   = useState('')
  const [dataInicio, setDataInicio]   = useState('')
  const [dataFim, setDataFim]         = useState('')

  const resumo = resumoGeral()

  const lista = useMemo(() =>
    lancamentos
      .filter(l => {
        if (filtroTipo && l.tipo !== filtroTipo) return false
        if (filtroObra && l.obraId !== filtroObra) return false
        if (dataInicio && l.data < dataInicio) return false
        if (dataFim    && l.data > dataFim)    return false
        return true
      })
      .sort((a, b) => b.data.localeCompare(a.data)),
    [lancamentos, filtroTipo, filtroObra, dataInicio, dataFim]
  )

  const hasFilters = filtroTipo || filtroObra || dataInicio || dataFim

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">Visão consolidada de todas as obras</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Receitas" value={formatCurrency(resumo.totalReceitas)} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatCard title="Total Despesas" value={formatCurrency(resumo.totalDespesas)} icon={<TrendingDown className="w-5 h-5" />} color="red" />
        <StatCard title="Saldo Geral" value={formatCurrency(resumo.saldo)} icon={<Wallet className="w-5 h-5" />} color={resumo.saldo >= 0 ? 'green' : 'red'} />
      </div>

      {/* Resumo por obra */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Saldo por Obra</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {obras.map(obra => {
            const r = useFinanceiroStore.getState().resumoObra(obra.id)
            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}?tab=financeiro`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{obra.nome}</p>
                  <p className="text-xs text-gray-400">{obra.localidade}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex gap-4 text-xs text-right">
                    <div>
                      <p className="text-gray-400">Receitas</p>
                      <p className="text-green-600 font-medium">{formatCurrency(r.totalReceitas)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Despesas</p>
                      <p className="text-red-500 font-medium">{formatCurrency(r.totalDespesas)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Saldo</p>
                    <p className={`text-sm font-bold ${r.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(r.saldo)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Todos os lançamentos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Todos os Lançamentos</h2>
          {hasFilters && (
            <button
              onClick={() => { setFiltroTipo(''); setFiltroObra(''); setDataInicio(''); setDataFim('') }}
              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />Limpar filtros
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['', 'receita', 'despesa'] as const).map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === tipo ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tipo === '' ? 'Todos' : tipo === 'receita' ? 'Receitas' : 'Despesas'}
            </button>
          ))}

          <select
            value={filtroObra}
            onChange={e => setFiltroObra(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
          >
            <option value="">Todas as obras</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>

          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
        </div>

        {lista.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-10 h-10" />}
            title="Nenhum lançamento encontrado"
            description={hasFilters ? 'Tente outros filtros.' : 'Adicione lançamentos nas obras.'}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Data', 'Obra', 'Tipo', 'Categoria', 'Descrição', 'Trabalhador', 'Valor'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.map(l => {
                    const obra = obras.find(o => o.id === l.obraId)
                    const trab = l.trabalhadorId ? trabalhadores.find(t => t.id === l.trabalhadorId) : null
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(l.data)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/obras/${l.obraId}`} className="text-orange-500 hover:underline text-xs max-w-[120px] truncate block">
                            {obra?.nome ?? '-'}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><TipoBadge tipo={l.tipo} /></td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{l.categoria}</td>
                        <td className="px-4 py-3 text-gray-900 max-w-[160px] truncate">{l.descricao}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{trab?.nome ?? '-'}</td>
                        <td className={`px-4 py-3 font-semibold whitespace-nowrap ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                          {l.tipo === 'despesa' ? '-' : '+'}{formatCurrency(l.valor)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-xs font-medium text-gray-500 text-right">
                      {lista.length} lançamento(s) · Saldo filtrado:
                    </td>
                    <td className={`px-4 py-3 font-bold text-sm ${
                      lista.reduce((s, l) => s + (l.tipo === 'receita' ? l.valor : -l.valor), 0) >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {formatCurrency(lista.reduce((s, l) => s + (l.tipo === 'receita' ? l.valor : -l.valor), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
