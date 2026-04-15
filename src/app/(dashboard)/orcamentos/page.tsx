'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, FileText, Edit, Copy, Trash2,
  Eye, Download, ChevronDown,
} from 'lucide-react'
import { useOrcamentoStore } from '@/store/orcamentoStore'
import {
  Orcamento,
  StatusOrcamento,
  STATUS_ORCAMENTO_LABELS,
  STATUS_ORCAMENTO_COLORS,
} from '@/types/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'
import { downloadPdfOrcamento } from '@/services/pdfService'
import { EMPRESA_CONFIG } from '@/config/empresa'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: StatusOrcamento | 'todos'; label: string }[] = [
  { value: 'todos',    label: 'Todos os estados' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado',  label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export default function OrcamentosPage() {
  const router  = useRouter()
  const { orcamentos, loading, removeOrcamento, duplicar } = useOrcamentoStore()

  const [search,    setSearch]    = useState('')
  const [statusFil, setStatusFil] = useState<StatusOrcamento | 'todos'>('todos')
  const [deletando, setDeletando] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Orcamento | null>(null)

  // ── Filtros ────────────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    let r = [...orcamentos]
    if (statusFil !== 'todos') r = r.filter(o => o.status === statusFil)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(o =>
        o.clienteNome.toLowerCase().includes(q) ||
        o.numero.toLowerCase().includes(q) ||
        (o.obraReferencia ?? '').toLowerCase().includes(q),
      )
    }
    return r
  }, [orcamentos, statusFil, search])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    orcamentos.length,
    aprovado: orcamentos.filter(o => o.status === 'aprovado').length,
    enviado:  orcamentos.filter(o => o.status === 'enviado').length,
    valorTotal: orcamentos
      .filter(o => o.status !== 'cancelado' && o.status !== 'rejeitado')
      .reduce((s, o) => s + o.total, 0),
  }), [orcamentos])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleDelete(o: Orcamento) {
    setDeletando(o.id)
    try { await removeOrcamento(o.id) } finally {
      setDeletando(null)
      setConfirmDelete(null)
    }
  }

  async function handleDuplicar(id: string) {
    const novo = await duplicar(id)
    router.push(`/orcamentos/${novo.id}/editar`)
  }

  async function handlePdf(o: Orcamento) {
    setPdfLoading(o.id)
    try { await downloadPdfOrcamento(o, EMPRESA_CONFIG) }
    finally { setPdfLoading(null) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerir propostas e orçamentos de serviços</p>
        </div>
        <button
          onClick={() => router.push('/orcamentos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Orçamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total,             fmt: false, color: 'text-gray-900' },
          { label: 'Enviados', value: stats.enviado,           fmt: false, color: 'text-blue-600' },
          { label: 'Aprovados',value: stats.aprovado,          fmt: false, color: 'text-green-600' },
          { label: 'Valor em aberto', value: stats.valorTotal, fmt: true,  color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={cn('text-xl font-bold mt-1', s.color)}>
              {s.fmt ? formatCurrency(s.value as number) : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, número ou obra…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="relative">
          <select
            value={statusFil}
            onChange={e => setStatusFil(e.target.value as StatusOrcamento | 'todos')}
            className="appearance-none pl-3 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-[160px]"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Lista */}
      {loading && !orcamentos.length ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <FileText className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">
            {search || statusFil !== 'todos' ? 'Nenhum orçamento encontrado' : 'Ainda sem orçamentos'}
          </p>
          {!search && statusFil === 'todos' && (
            <button
              onClick={() => router.push('/orcamentos/novo')}
              className="text-sm text-orange-500 font-semibold hover:underline"
            >
              Criar primeiro orçamento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(orc => (
            <OrcamentoCard
              key={orc.id}
              orc={orc}
              onView={() => router.push(`/orcamentos/${orc.id}`)}
              onEdit={() => router.push(`/orcamentos/${orc.id}/editar`)}
              onDuplicate={() => handleDuplicar(orc.id)}
              onPdf={() => handlePdf(orc)}
              onDelete={() => setConfirmDelete(orc)}
              pdfLoading={pdfLoading === orc.id}
            />
          ))}
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Excluir orçamento?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem a certeza que deseja excluir o orçamento <strong>{confirmDelete.numero}</strong> de{' '}
              <strong>{confirmDelete.clienteNome}</strong>? Esta acção não pode ser revertida.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletando === confirmDelete.id}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deletando === confirmDelete.id ? 'A excluir…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── OrcamentoCard ──────────────────────────────────────────────────────────

interface CardProps {
  orc:        Orcamento
  onView:     () => void
  onEdit:     () => void
  onDuplicate:() => void
  onPdf:      () => void
  onDelete:   () => void
  pdfLoading: boolean
}

function OrcamentoCard({ orc, onView, onEdit, onDuplicate, onPdf, onDelete, pdfLoading }: CardProps) {
  const canEdit = orc.status !== 'cancelado'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-5">
        {/* Linha superior */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-gray-400">{orc.numero}</span>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                STATUS_ORCAMENTO_COLORS[orc.status],
              )}>
                {STATUS_ORCAMENTO_LABELS[orc.status]}
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm mt-1 truncate">{orc.clienteNome}</p>
            {orc.obraReferencia && (
              <p className="text-xs text-gray-500 truncate">{orc.obraReferencia}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-orange-600">{formatCurrency(orc.total)}</p>
            <p className="text-xs text-gray-400">{orc.itens.length} item(s)</p>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-gray-400">
            Criado em {formatDate(orc.criadoEm)} · Válido até {formatDate(orc.validadeData)}
          </p>
          <div className="flex items-center gap-1">
            <ActionBtn icon={Eye}      title="Visualizar"  onClick={onView} />
            {canEdit && <ActionBtn icon={Edit} title="Editar"     onClick={onEdit} />}
            <ActionBtn icon={Copy}     title="Duplicar"    onClick={onDuplicate} />
            <ActionBtn
              icon={Download}
              title="Descarregar PDF"
              onClick={onPdf}
              loading={pdfLoading}
            />
            <ActionBtn icon={Trash2} title="Excluir" onClick={onDelete} danger />
          </div>
        </div>
      </div>
    </div>
  )
}

interface BtnProps {
  icon:    React.ElementType
  title:   string
  onClick: () => void
  danger?: boolean
  loading?:boolean
}

function ActionBtn({ icon: Icon, title, onClick, danger, loading }: BtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className={cn(
        'p-2 rounded-xl transition-colors disabled:opacity-50',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
