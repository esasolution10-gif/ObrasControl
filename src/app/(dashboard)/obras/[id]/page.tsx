'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, MapPin, Calendar, Users, Download,
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet,
  UserCheck, UserMinus,
} from 'lucide-react'
import { useObraStore } from '@/store/obraStore'
import { useTrabalhadorStore } from '@/store/trabalhadorStore'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatusBadge, TipoBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { exportObraToXLSX } from '@/lib/export'
import { formatCurrency, formatDate, formatDateForInput, todayISO, getInitials } from '@/utils/format'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, type LancamentoFormData, type TipoLancamento } from '@/types'

type Tab = 'detalhes' | 'financeiro' | 'equipe'

const LANCAMENTO_VAZIO: Omit<LancamentoFormData, 'obraId'> = {
  tipo: 'despesa', categoria: 'Material', descricao: '',
  valor: 0, data: todayISO(), trabalhadorId: null, observacoes: '',
}

export default function ObraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const obra = useObraStore(s => s.getById(id))
  const { trabalhadores, vincularObra, desvincularObra } = useTrabalhadorStore()
  const { vincularTrabalhador, desvincularTrabalhador } = useObraStore()
  const { lancamentos, addLancamento, updateLancamento, deleteLancamento, resumoObra } = useFinanceiroStore()

  const [tab, setTab] = useState<Tab>('detalhes')
  const [filtroTipo, setFiltroTipo]   = useState<'' | TipoLancamento>('')
  const [dataInicio, setDataInicio]   = useState('')
  const [dataFim, setDataFim]         = useState('')
  const [modalLanc, setModalLanc]     = useState(false)
  const [editingLancId, setEditingLancId] = useState<string | null>(null)
  const [deleteLancId, setDeleteLancId]   = useState<string | null>(null)
  const [lancForm, setLancForm]       = useState<Omit<LancamentoFormData, 'obraId'>>(LANCAMENTO_VAZIO)
  const [lancErrors, setLancErrors]   = useState<Record<string, string>>({})
  const [savingLanc, setSavingLanc]   = useState(false)

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Building2 className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Obra não encontrada.</p>
        <Button variant="secondary" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const equipe = trabalhadores.filter(t => obra.trabalhadoresIds.includes(t.id))
  const disponiveis = trabalhadores.filter(t => !obra.trabalhadoresIds.includes(t.id))

  const obraLancamentos = useMemo(() => {
    return lancamentos
      .filter(l => {
        if (l.obraId !== id) return false
        if (filtroTipo && l.tipo !== filtroTipo) return false
        if (dataInicio && l.data < dataInicio) return false
        if (dataFim    && l.data > dataFim)    return false
        return true
      })
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [lancamentos, id, filtroTipo, dataInicio, dataFim])

  const resumo = resumoObra(id)

  const categorias = useMemo(
    () => (lancForm.tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA).map(c => ({ value: c, label: c })),
    [lancForm.tipo]
  )

  function openCreateLanc() {
    setLancForm({ ...LANCAMENTO_VAZIO, categoria: CATEGORIAS_DESPESA[0] })
    setEditingLancId(null)
    setLancErrors({})
    setModalLanc(true)
  }

  function openEditLanc(lancId: string) {
    const l = lancamentos.find(l => l.id === lancId)
    if (!l) return
    setLancForm({ tipo: l.tipo, categoria: l.categoria, descricao: l.descricao, valor: l.valor, data: l.data, trabalhadorId: l.trabalhadorId, observacoes: l.observacoes })
    setEditingLancId(lancId)
    setLancErrors({})
    setModalLanc(true)
  }

  function validateLanc() {
    const e: Record<string, string> = {}
    if (!lancForm.descricao.trim()) e.descricao = 'Descrição é obrigatória.'
    if (!lancForm.valor || lancForm.valor <= 0) e.valor = 'Valor deve ser maior que zero.'
    if (!lancForm.data) e.data = 'Data é obrigatória.'
    setLancErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSaveLanc() {
    if (!validateLanc()) return
    setSavingLanc(true)
    try {
      const data: LancamentoFormData = { ...lancForm, obraId: id }
      if (editingLancId) {
        await updateLancamento(editingLancId, data)
      } else {
        await addLancamento(data)
      }
      setModalLanc(false)
    } finally {
      setSavingLanc(false)
    }
  }

  async function toggleEquipe(trabId: string) {
    if (!obra) return
    if (obra.trabalhadoresIds.includes(trabId)) {
      await desvincularTrabalhador(id, trabId)
      desvincularObra(trabId, id)
    } else {
      await vincularTrabalhador(id, trabId)
      vincularObra(trabId, id)
    }
  }

  function handleExport() {
    if (!obra) return
    exportObraToXLSX(obra, equipe, obraLancamentos, trabalhadores)
  }

  const lF = (field: keyof typeof lancForm, value: string | number | null) => {
    setLancForm(p => {
      const updated = { ...p, [field]: value }
      if (field === 'tipo') {
        const cats = value === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA
        updated.categoria = cats[0]
      }
      return updated
    })
    if (lancErrors[field as string]) setLancErrors(p => ({ ...p, [field]: undefined as unknown as string }))
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'detalhes',   label: 'Detalhes' },
    { id: 'financeiro', label: `Financeiro (${obraLancamentos.length})` },
    { id: 'equipe',     label: `Equipe (${equipe.length})` },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/obras" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-4 h-4" /> Obras
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium truncate">{obra.nome}</span>
      </div>

      {/* Header da obra */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
              <Building2 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900">{obra.nome}</h1>
                <StatusBadge status={obra.status} />
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{obra.localidade}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {formatDate(obra.dataInicio)} → {obra.dataPrevisaoTermino ? formatDate(obra.dataPrevisaoTermino) : 'Sem previsão'}
              </p>
              {obra.descricao && <p className="text-sm text-gray-600 mt-2">{obra.descricao}</p>}
            </div>
          </div>
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            Exportar .xlsx
          </Button>
        </div>

        {/* Cards financeiros */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-500">Receitas</p>
            </div>
            <p className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(resumo.totalReceitas)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-500">Despesas</p>
            </div>
            <p className="font-bold text-red-500 text-sm sm:text-base">{formatCurrency(resumo.totalDespesas)}</p>
          </div>
          <div className={`rounded-xl p-4 ${resumo.saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">Saldo</p>
            </div>
            <p className={`font-bold text-sm sm:text-base ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(resumo.saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Detalhes ───────────────────────────────────────────────────── */}
      {tab === 'detalhes' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {[
            { label: 'Nome',             value: obra.nome },
            { label: 'Localidade',       value: obra.localidade },
            { label: 'Status',           value: obra.status },
            { label: 'Início',           value: formatDate(obra.dataInicio) },
            { label: 'Previsão Término', value: obra.dataPrevisaoTermino ? formatDate(obra.dataPrevisaoTermino) : '-' },
            { label: 'Descrição',        value: obra.descricao || '-' },
            { label: 'Observações',      value: obra.observacoes || '-' },
          ].map(item => (
            <div key={item.label} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
              <p className="text-sm font-medium text-gray-500 w-40 flex-shrink-0">{item.label}</p>
              <p className="text-sm text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Financeiro ─────────────────────────────────────────────────── */}
      {tab === 'financeiro' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2 flex-wrap">
              {(['', 'receita', 'despesa'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtroTipo === tipo
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tipo === '' ? 'Todos' : tipo === 'receita' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
            </div>
            <Button size="sm" onClick={openCreateLanc}>
              <Plus className="w-4 h-4" />Novo Lançamento
            </Button>
          </div>

          {obraLancamentos.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-8 h-8" />}
              title="Nenhum lançamento"
              description="Registre despesas e receitas desta obra."
              action={<Button size="sm" onClick={openCreateLanc}><Plus className="w-4 h-4" />Novo Lançamento</Button>}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Data', 'Tipo', 'Categoria', 'Descrição', 'Trabalhador', 'Valor', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {obraLancamentos.map(l => {
                      const trab = l.trabalhadorId ? trabalhadores.find(t => t.id === l.trabalhadorId) : null
                      return (
                        <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(l.data)}</td>
                          <td className="px-4 py-3"><TipoBadge tipo={l.tipo} /></td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.categoria}</td>
                          <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">{l.descricao}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{trab?.nome ?? '-'}</td>
                          <td className={`px-4 py-3 font-semibold whitespace-nowrap ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                            {l.tipo === 'despesa' ? '-' : '+'}{formatCurrency(l.valor)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditLanc(l.id)} className="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteLancId(l.id)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Equipe ─────────────────────────────────────────────────────── */}
      {tab === 'equipe' && (
        <div className="space-y-4">
          {equipe.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Vinculados à obra ({equipe.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {equipe.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(t.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.nome}</p>
                        <p className="text-xs text-gray-400">{t.funcao}{t.diaria ? ` · ${formatCurrency(t.diaria)}/dia` : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleEquipe(t.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {disponiveis.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Disponíveis para vincular ({disponiveis.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {disponiveis.map(t => (
                  <div key={t.id} className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(t.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{t.nome}</p>
                        <p className="text-xs text-gray-400">{t.funcao}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleEquipe(t.id)} className="p-1.5 rounded-lg text-green-500 hover:text-green-600 hover:bg-green-50 flex-shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trabalhadores.length === 0 && (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="Nenhum trabalhador cadastrado"
              description="Cadastre trabalhadores na aba Trabalhadores."
              action={<Link href="/trabalhadores"><Button size="sm"><Plus className="w-4 h-4" />Cadastrar</Button></Link>}
            />
          )}
        </div>
      )}

      {/* Modal Lançamento */}
      <Modal
        open={modalLanc}
        onClose={() => setModalLanc(false)}
        title={editingLancId ? 'Editar Lançamento' : 'Novo Lançamento'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalLanc(false)}>Cancelar</Button>
            <Button onClick={handleSaveLanc} disabled={savingLanc}>{savingLanc ? 'Salvando…' : editingLancId ? 'Salvar' : 'Adicionar'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['despesa', 'receita'] as const).map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => lF('tipo', tipo)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  lancForm.tipo === tipo
                    ? tipo === 'despesa' ? 'bg-red-50 border-red-300 text-red-600' : 'bg-green-50 border-green-300 text-green-600'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tipo === 'despesa' ? '↓ Despesa' : '↑ Receita'}
              </button>
            ))}
          </div>
          <Select
            label="Categoria"
            value={lancForm.categoria}
            onChange={e => lF('categoria', e.target.value)}
            options={categorias}
          />
          <Input label="Descrição *" value={lancForm.descricao} onChange={e => lF('descricao', e.target.value)} error={lancErrors.descricao} placeholder="Ex: Compra de cimento" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (€) *" type="number" min="0.01" step="0.01" value={lancForm.valor || ''} onChange={e => lF('valor', parseFloat(e.target.value) || 0)} error={lancErrors.valor} placeholder="0,00" />
            <Input label="Data *" type="date" value={lancForm.data} onChange={e => lF('data', e.target.value)} error={lancErrors.data} />
          </div>
          <Select
            label="Trabalhador (opcional)"
            value={lancForm.trabalhadorId ?? ''}
            onChange={e => lF('trabalhadorId', e.target.value || null)}
            options={equipe.map(t => ({ value: t.id, label: t.nome }))}
            placeholder="Nenhum"
          />
          <Input label="Observações" value={lancForm.observacoes} onChange={e => lF('observacoes', e.target.value)} placeholder="Opcional" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteLancId}
        onClose={() => setDeleteLancId(null)}
        onConfirm={async () => { if (deleteLancId) { await deleteLancamento(deleteLancId); setDeleteLancId(null) } }}
        message="Este lançamento será excluído permanentemente."
      />
    </div>
  )
}
