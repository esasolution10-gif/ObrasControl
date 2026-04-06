'use client'

import { useState, useMemo } from 'react'
import {
  CalendarCheck, Building2, Users, CheckCircle2, Circle,
  AlertCircle, Loader2, TrendingDown, Plus, Trash2,
} from 'lucide-react'
import { useObraStore } from '@/store/obraStore'
import { useTrabalhadorStore } from '@/store/trabalhadorStore'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { Button } from '@/components/ui/Button'
import { formatCurrency, todayISO, getInitials } from '@/utils/format'
import { CATEGORIAS_DESPESA } from '@/types'

type Tab = 'diarias' | 'despesas'

interface LinhaDespesa {
  id:        string
  categoria: string
  descricao: string
  valor:     string
}

function novaLinha(): LinhaDespesa {
  return { id: crypto.randomUUID(), categoria: CATEGORIAS_DESPESA[0], descricao: '', valor: '' }
}

export default function FolhaDiariaPage() {
  const { obras }         = useObraStore()
  const { trabalhadores } = useTrabalhadorStore()
  const { addLancamento } = useFinanceiroStore()

  const [tab, setTab]           = useState<Tab>('diarias')
  const [obraId, setObraId]     = useState('')
  const [data, setData]         = useState(todayISO())

  // ── Diárias ────────────────────────────────────────────────────────────────
  const [selecionados, setSel]  = useState<Set<string>>(new Set())
  const [savingD, setSavingD]   = useState(false)
  const [successD, setSuccessD] = useState(false)

  // ── Despesas ───────────────────────────────────────────────────────────────
  const [linhas, setLinhas]     = useState<LinhaDespesa[]>([novaLinha()])
  const [savingE, setSavingE]   = useState(false)
  const [successE, setSuccessE] = useState(false)
  const [errosE, setErrosE]     = useState<Record<string, string>>({})

  const obra = obras.find(o => o.id === obraId)

  const equipe = useMemo(() => {
    if (!obra) return []
    return trabalhadores.filter(t => obra.trabalhadoresIds.includes(t.id) && t.ativo)
  }, [obra, trabalhadores])

  const semDiaria   = equipe.filter(t => !t.diaria)
  const comDiaria   = equipe.filter(t => !!t.diaria)
  const todosAtivos = comDiaria.length > 0 && comDiaria.every(t => selecionados.has(t.id))

  const totalDiarias = useMemo(() =>
    equipe.filter(t => selecionados.has(t.id) && t.diaria).reduce((s, t) => s + (t.diaria ?? 0), 0),
    [equipe, selecionados]
  )

  const totalDespesas = useMemo(() =>
    linhas.reduce((s, l) => s + (parseFloat(l.valor) || 0), 0),
    [linhas]
  )

  function changeObra(id: string) {
    setObraId(id)
    setSel(new Set())
    setSuccessD(false)
    setSuccessE(false)
  }

  // ── Handlers Diárias ───────────────────────────────────────────────────────
  function toggle(id: string) {
    setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll() {
    const ids = comDiaria.map(t => t.id)
    setSel(todosAtivos ? new Set() : new Set(ids))
  }

  async function handleDiarias() {
    if (!obraId || selecionados.size === 0) return
    setSavingD(true)
    try {
      await Promise.all(
        equipe
          .filter(t => selecionados.has(t.id) && t.diaria)
          .map(t => addLancamento({
            obraId, tipo: 'despesa', categoria: 'Mão de Obra',
            descricao: `Diária — ${t.nome}`, valor: t.diaria!,
            data, trabalhadorId: t.id, observacoes: '',
          }))
      )
      setSel(new Set())
      setSuccessD(true)
      setTimeout(() => setSuccessD(false), 4000)
    } finally {
      setSavingD(false)
    }
  }

  // ── Handlers Despesas ──────────────────────────────────────────────────────
  function updateLinha(id: string, field: keyof LinhaDespesa, value: string) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    if (errosE[id]) setErrosE(p => { const n = { ...p }; delete n[id]; return n })
  }

  function removeLinha(id: string) {
    setLinhas(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }

  function validateDespesas(): boolean {
    const erros: Record<string, string> = {}
    linhas.forEach(l => {
      if (!l.descricao.trim()) erros[l.id] = 'Descrição obrigatória'
      else if (!l.valor || parseFloat(l.valor) <= 0) erros[l.id] = 'Valor inválido'
    })
    setErrosE(erros)
    return Object.keys(erros).length === 0
  }

  async function handleDespesas() {
    if (!obraId || !validateDespesas()) return
    setSavingE(true)
    try {
      await Promise.all(
        linhas.map(l => addLancamento({
          obraId, tipo: 'despesa', categoria: l.categoria,
          descricao: l.descricao.trim(), valor: parseFloat(l.valor),
          data, trabalhadorId: null, observacoes: '',
        }))
      )
      setLinhas([novaLinha()])
      setSuccessE(true)
      setTimeout(() => setSuccessE(false), 4000)
    } finally {
      setSavingE(false)
    }
  }

  // ── Selecção obra + data (partilhada) ──────────────────────────────────────
  const obrasFiltradas = obras.filter(o => o.status === 'em-andamento' || o.status === 'planejada')

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-orange-500" />
          Folha Diária
        </h1>
        <p className="text-sm text-gray-500 mt-1">Registo rápido do dia de trabalho.</p>
      </div>

      {/* Obra + Data */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Obra</label>
            <select
              value={obraId}
              onChange={e => changeObra(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Seleccionar obra…</option>
              {obrasFiltradas.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('diarias')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'diarias'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Diárias
        </button>
        <button
          onClick={() => setTab('despesas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'despesas'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Despesas
        </button>
      </div>

      {/* ── TAB DIÁRIAS ─────────────────────────────────────────────────────── */}
      {tab === 'diarias' && (
        <>
          {!obraId && (
            <Empty icon={<Building2 className="w-12 h-12 opacity-30" />} text="Seleccione uma obra para ver a equipa" />
          )}

          {obraId && equipe.length === 0 && (
            <Empty icon={<Users className="w-12 h-12 opacity-30" />} text="Nenhum trabalhador activo associado a esta obra" />
          )}

          {obraId && equipe.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header lista */}
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Equipa — {obra?.nome}</p>
                <button onClick={toggleAll} className="text-xs font-medium text-orange-500 hover:text-orange-600">
                  {todosAtivos ? 'Desmarcar todos' : 'Seleccionar todos'}
                </button>
              </div>

              {semDiaria.length > 0 && (
                <div className="mx-4 mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{semDiaria.map(t => t.nome.split(' ')[0]).join(', ')} sem diária definida.</span>
                </div>
              )}

              <ul className="divide-y divide-gray-50 p-2">
                {equipe.map(t => {
                  const sel = selecionados.has(t.id)
                  const ok  = !!t.diaria
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => ok && toggle(t.id)}
                        disabled={!ok}
                        className={`w-full flex items-center gap-4 px-3 py-3.5 rounded-xl transition-colors ${
                          !ok ? 'opacity-40 cursor-not-allowed' : sel ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${sel ? 'text-orange-500' : 'text-gray-300'}`}>
                          {sel ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${sel ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                          {getInitials(t.nome)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm font-semibold truncate ${sel ? 'text-gray-900' : 'text-gray-700'}`}>{t.nome}</p>
                          <p className="text-xs text-gray-400">{t.funcao}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {ok
                            ? <p className={`text-sm font-bold ${sel ? 'text-orange-600' : 'text-gray-500'}`}>{formatCurrency(t.diaria!)}</p>
                            : <p className="text-xs text-gray-400">sem diária</p>
                          }
                          <p className="text-xs text-gray-400">/ dia</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{selecionados.size} trabalhador{selecionados.size !== 1 ? 'es' : ''} seleccionado{selecionados.size !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400">Total a debitar da obra</p>
                  </div>
                  <p className={`text-2xl font-bold ${totalDiarias > 0 ? 'text-red-600' : 'text-gray-300'}`}>{formatCurrency(totalDiarias)}</p>
                </div>

                {successD && <SuccessBanner text="Diárias registadas com sucesso!" />}

                <Button onClick={handleDiarias} disabled={selecionados.size === 0 || savingD} className="w-full justify-center">
                  {savingD ? <><Loader2 className="w-4 h-4 animate-spin" /> A registar…</> : <><CalendarCheck className="w-4 h-4" /> Registar Diárias</>}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB DESPESAS ────────────────────────────────────────────────────── */}
      {tab === 'despesas' && (
        <>
          {!obraId && (
            <Empty icon={<Building2 className="w-12 h-12 opacity-30" />} text="Seleccione uma obra para registar despesas" />
          )}

          {obraId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Despesas — {obra?.nome}</p>
                <span className="text-xs text-gray-400">{linhas.length} linha{linhas.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Lista de despesas — cards empilhados */}
              <ul className="px-4 pt-3 pb-2 space-y-3">
                {linhas.map((l, i) => (
                  <li key={l.id} className="bg-gray-50 rounded-2xl p-3 space-y-2.5">
                    {/* Linha 1: número + categoria + botão remover */}
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <select
                        value={l.categoria}
                        onChange={e => updateLinha(l.id, 'categoria', e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        onClick={() => removeLinha(l.id)}
                        disabled={linhas.length === 1}
                        className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Linha 2: descrição (largura total) */}
                    <div>
                      <input
                        type="text"
                        value={l.descricao}
                        onChange={e => updateLinha(l.id, 'descricao', e.target.value)}
                        placeholder="Descrição da despesa…"
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          errosE[l.id] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                      />
                      {errosE[l.id] && <p className="text-xs text-red-500 mt-1 pl-1">{errosE[l.id]}</p>}
                    </div>

                    {/* Linha 3: valor */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-medium pl-1">€</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={l.valor}
                        onChange={e => updateLinha(l.id, 'valor', e.target.value)}
                        placeholder="0,00"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Botão adicionar linha */}
              <div className="px-4 pb-3">
                <button
                  onClick={() => setLinhas(p => [...p, novaLinha()])}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar despesa
                </button>
              </div>

              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{linhas.length} despesa{linhas.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400">Total a debitar da obra</p>
                  </div>
                  <p className={`text-2xl font-bold ${totalDespesas > 0 ? 'text-red-600' : 'text-gray-300'}`}>{formatCurrency(totalDespesas)}</p>
                </div>

                {successE && <SuccessBanner text="Despesas registadas com sucesso!" />}

                <Button onClick={handleDespesas} disabled={savingE} className="w-full justify-center">
                  {savingE ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar…</> : <><TrendingDown className="w-4 h-4" /> Registar Despesas</>}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  )
}

function SuccessBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      {text}
    </div>
  )
}
