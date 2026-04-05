'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, MapPin, Calendar, ArrowRight, Pencil, Trash2, TrendingDown } from 'lucide-react'
import { useObraStore } from '@/store/obraStore'
import { useFinanceiroStore } from '@/store/financeiroStore'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, formatDateForInput, todayISO } from '@/utils/format'
import type { ObraFormData, StatusObra, LancamentoFormData } from '@/types'
import { STATUS_OBRA_LABELS, CATEGORIAS_DESPESA } from '@/types'

const EMPTY_DESPESA: Omit<LancamentoFormData, 'obraId'> = {
  tipo: 'despesa',
  categoria: CATEGORIAS_DESPESA[0],
  descricao: '',
  valor: 0,
  data: '',
  trabalhadorId: null,
  observacoes: '',
}

const EMPTY_FORM: ObraFormData = {
  nome: '', localidade: '', descricao: '',
  dataInicio: todayISO(),
  dataPrevisaoTermino: '',
  status: 'planejada', observacoes: '',
}

const STATUS_OPTIONS = [
  { value: '',             label: 'Todos os status' },
  ...Object.entries(STATUS_OBRA_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

export default function ObrasPage() {
  const { obras, addObra, updateObra, deleteObra } = useObraStore()
  const { resumoObra, addLancamento } = useFinanceiroStore()

  const [search, setSearch]             = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [form, setForm]                 = useState<ObraFormData>(EMPTY_FORM)
  const [errors, setErrors]             = useState<Partial<Record<keyof ObraFormData, string>>>({})
  const [saving, setSaving]             = useState(false)

  // Despesa rápida
  const [despesaObraId, setDespesaObraId] = useState<string | null>(null)
  const [despesa, setDespesa]             = useState<Omit<LancamentoFormData, 'obraId'>>(EMPTY_DESPESA)
  const [despesaErrors, setDespesaErrors] = useState<Record<string, string>>({})
  const [savingDespesa, setSavingDespesa] = useState(false)

  const obrasFiltradas = useMemo(() => {
    return obras.filter(o => {
      const textoOk = !search || o.nome.toLowerCase().includes(search.toLowerCase()) || o.localidade.toLowerCase().includes(search.toLowerCase())
      const statusOk = !filtroStatus || o.status === filtroStatus
      return textoOk && statusOk
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [obras, search, filtroStatus])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const o = obras.find(o => o.id === id)
    if (!o) return
    setForm({
      nome: o.nome, localidade: o.localidade, descricao: o.descricao,
      dataInicio: formatDateForInput(o.dataInicio),
      dataPrevisaoTermino: formatDateForInput(o.dataPrevisaoTermino),
      status: o.status, observacoes: o.observacoes,
    })
    setEditingId(id)
    setErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.nome.trim())       e.nome       = 'Nome é obrigatório.'
    if (!form.localidade.trim()) e.localidade = 'Localidade é obrigatória.'
    if (!form.dataInicio)        e.dataInicio = 'Data de início é obrigatória.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateObra(editingId, form)
      } else {
        await addObra(form)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteObra(deleteId)
    setDeleteId(null)
  }

  function f(field: keyof ObraFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function openDespesa(obraId: string) {
    setDespesa({ ...EMPTY_DESPESA, data: todayISO() })
    setDespesaErrors({})
    setDespesaObraId(obraId)
  }

  function dF(field: keyof typeof despesa, value: string | number | null) {
    setDespesa(p => ({ ...p, [field]: value }))
    if (despesaErrors[field as string]) setDespesaErrors(p => ({ ...p, [field]: undefined as any }))
  }

  function validateDespesa(): boolean {
    const e: Record<string, string> = {}
    if (!despesa.descricao.trim())       e.descricao = 'Descrição é obrigatória.'
    if (!despesa.valor || despesa.valor <= 0) e.valor = 'Valor deve ser maior que zero.'
    if (!despesa.data)                   e.data = 'Data é obrigatória.'
    setDespesaErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSaveDespesa() {
    if (!despesaObraId || !validateDespesa()) return
    setSavingDespesa(true)
    try {
      await addLancamento({ ...despesa, obraId: despesaObraId })
      setDespesaObraId(null)
    } finally {
      setSavingDespesa(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-sm text-gray-500">{obras.length} obra(s) cadastrada(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nova Obra
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou localidade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="sm:w-52">
          <Select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Lista de obras */}
      {obrasFiltradas.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-10 h-10" />}
          title="Nenhuma obra encontrada"
          description={search || filtroStatus ? 'Tente outro filtro.' : 'Clique em Nova Obra para começar.'}
          action={!search && !filtroStatus ? <Button onClick={openCreate}><Plus className="w-4 h-4" />Nova Obra</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {obrasFiltradas.map(obra => {
            const resumo = resumoObra(obra.id)
            return (
              <div key={obra.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Topo */}
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{obra.nome}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{obra.localidade}
                      </p>
                    </div>
                    <StatusBadge status={obra.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <Calendar className="w-3 h-3" />
                    {formatDate(obra.dataInicio)} → {formatDate(obra.dataPrevisaoTermino)}
                  </div>

                  {/* Financeiro resumido */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-xl py-2">
                      <p className="text-xs text-gray-400">Receitas</p>
                      <p className="text-xs font-semibold text-green-600 truncate">{formatCurrency(resumo.totalReceitas)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl py-2">
                      <p className="text-xs text-gray-400">Despesas</p>
                      <p className="text-xs font-semibold text-red-500 truncate">{formatCurrency(resumo.totalDespesas)}</p>
                    </div>
                    <div className={`rounded-xl py-2 ${resumo.saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-xs text-gray-400">Saldo</p>
                      <p className={`text-xs font-semibold truncate ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(resumo.saldo)}</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                  <button
                    onClick={() => openDespesa(obra.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Adicionar Despesa
                  </button>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(obra.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(obra.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Link
                      href={`/obras/${obra.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                    >
                      Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Obra' : 'Nova Obra'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : editingId ? 'Salvar' : 'Criar Obra'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome da obra *" value={form.nome} onChange={e => f('nome', e.target.value)} error={errors.nome} placeholder="Ex: Moradia Família Costa" />
          <Input label="Localidade *" value={form.localidade} onChange={e => f('localidade', e.target.value)} error={errors.localidade} placeholder="Ex: Lisboa" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de início *" type="date" value={form.dataInicio} onChange={e => f('dataInicio', e.target.value)} error={errors.dataInicio} />
            <Input label="Previsão de término" type="date" value={form.dataPrevisaoTermino} onChange={e => f('dataPrevisaoTermino', e.target.value)} min={form.dataInicio} />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={e => f('status', e.target.value as StatusObra)}
            options={Object.entries(STATUS_OBRA_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Input label="Descrição" value={form.descricao} onChange={e => f('descricao', e.target.value)} placeholder="Breve descrição da obra (opcional)" />
          <Input label="Observações" value={form.observacoes} onChange={e => f('observacoes', e.target.value)} placeholder="Informações adicionais (opcional)" />
        </div>
      </Modal>

      {/* Confirmação exclusão */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message={`A obra "${obras.find(o => o.id === deleteId)?.nome}" e todos os seus dados serão eliminados permanentemente.`}
      />

      {/* Modal Despesa Rápida */}
      <Modal
        open={!!despesaObraId}
        onClose={() => setDespesaObraId(null)}
        title={`Adicionar Despesa — ${obras.find(o => o.id === despesaObraId)?.nome ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDespesaObraId(null)}>Cancelar</Button>
            <Button onClick={handleSaveDespesa} disabled={savingDespesa}>
              {savingDespesa ? 'A guardar…' : 'Guardar Despesa'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Categoria"
            value={despesa.categoria}
            onChange={e => dF('categoria', e.target.value)}
            options={CATEGORIAS_DESPESA.map(c => ({ value: c, label: c }))}
          />
          <Input
            label="Descrição *"
            value={despesa.descricao}
            onChange={e => dF('descricao', e.target.value)}
            error={despesaErrors.descricao}
            placeholder="Ex: Compra de cimento"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (€) *"
              type="number"
              min="0.01"
              step="0.01"
              value={despesa.valor || ''}
              onChange={e => dF('valor', parseFloat(e.target.value) || 0)}
              error={despesaErrors.valor}
              placeholder="0,00"
            />
            <Input
              label="Data *"
              type="date"
              value={despesa.data}
              onChange={e => dF('data', e.target.value)}
              error={despesaErrors.data}
            />
          </div>
          <Input
            label="Observações"
            value={despesa.observacoes}
            onChange={e => dF('observacoes', e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </Modal>
    </div>
  )
}
