'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Users, Phone, Pencil, Trash2, Building2 } from 'lucide-react'
import { useTrabalhadorStore } from '@/store/trabalhadorStore'
import { useObraStore } from '@/store/obraStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PhoneCodeSelect, COUNTRY_CODES } from '@/components/ui/PhoneCodeSelect'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatPhone, getInitials } from '@/utils/format'
import type { TrabalhadorFormData } from '@/types'

const EMPTY_FORM: TrabalhadorFormData = {
  nome: '', funcao: '', telefone: '', diaria: null, ativo: true,
}

function splitPhone(full: string): { code: string; number: string } {
  for (const c of COUNTRY_CODES) {
    if (full.startsWith(c.code + ' ')) {
      return { code: c.code, number: full.slice(c.code.length + 1) }
    }
  }
  return { code: '+351', number: full }
}

export default function TrabalhadoresPage() {
  const { trabalhadores, addTrabalhador, updateTrabalhador, deleteTrabalhador } = useTrabalhadorStore()
  const { obras } = useObraStore()

  const [search, setSearch]           = useState('')
  const [apenasAtivos, setAtivos]     = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [form, setForm]               = useState<TrabalhadorFormData>(EMPTY_FORM)
  const [errors, setErrors]           = useState<Partial<Record<keyof TrabalhadorFormData, string>>>({})
  const [saving, setSaving]           = useState(false)
  const [phoneCode, setPhoneCode]     = useState('+351')

  const lista = useMemo(() =>
    trabalhadores
      .filter(t => {
        const textoOk = !search || t.nome.toLowerCase().includes(search.toLowerCase()) || t.funcao.toLowerCase().includes(search.toLowerCase())
        const ativoOk = !apenasAtivos || t.ativo
        return textoOk && ativoOk
      })
      .sort((a, b) => a.nome.localeCompare(b.nome)),
    [trabalhadores, search, apenasAtivos]
  )

  function openCreate() {
    setForm(EMPTY_FORM)
    setPhoneCode('+351')
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const t = trabalhadores.find(t => t.id === id)
    if (!t) return
    const { code, number } = splitPhone(t.telefone)
    setPhoneCode(code)
    setForm({ nome: t.nome, funcao: t.funcao, telefone: number, diaria: t.diaria, ativo: t.ativo })
    setEditingId(id)
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.nome.trim())  e.nome  = 'Nome é obrigatório.'
    if (!form.funcao.trim()) e.funcao = 'Função é obrigatória.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const fullPhone = form.telefone.trim() ? `${phoneCode} ${form.telefone.trim()}` : ''
    const payload = { ...form, telefone: fullPhone }
    try {
      if (editingId) {
        await updateTrabalhador(editingId, payload)
      } else {
        await addTrabalhador(payload)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  function f(field: keyof TrabalhadorFormData, value: string | number | boolean | null) {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabalhadores</h1>
          <p className="text-sm text-gray-500">{trabalhadores.filter(t => t.ativo).length} ativo(s) · {trabalhadores.length} total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />Novo Trabalhador
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou função…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <button
          onClick={() => setAtivos(v => !v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            apenasAtivos ? 'bg-orange-50 border-orange-300 text-orange-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {apenasAtivos ? 'Só ativos ✓' : 'Filtrar ativos'}
        </button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="Nenhum trabalhador encontrado"
          description={search ? 'Tente outro termo.' : 'Cadastre o primeiro trabalhador.'}
          action={!search ? <Button onClick={openCreate}><Plus className="w-4 h-4" />Novo Trabalhador</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map(t => {
            const obrasVinculadas = obras.filter(o => o.trabalhadoresIds.includes(t.id))
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${t.ativo ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    {getInitials(t.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{t.nome}</p>
                      {!t.ativo && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">Inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{t.funcao}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {t.telefone && (
                    <p className="flex items-center gap-2 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-300" />
                      {formatPhone(t.telefone)}
                    </p>
                  )}
                  {t.diaria && (
                    <p className="text-gray-500">
                      💰 {formatCurrency(t.diaria)}/dia
                    </p>
                  )}
                  {obrasVinculadas.length > 0 && (
                    <div className="flex items-start gap-2 text-gray-500">
                      <Building2 className="w-3.5 h-3.5 text-gray-300 mt-0.5" />
                      <span className="text-xs">{obrasVinculadas.map(o => o.nome).join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => openEdit(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />Editar
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Trabalhador' : 'Novo Trabalhador'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : editingId ? 'Salvar' : 'Cadastrar'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome completo *" value={form.nome} onChange={e => f('nome', e.target.value)} error={errors.nome} placeholder="Ex: João Manuel Ferreira" />
          <Input label="Função *" value={form.funcao} onChange={e => f('funcao', e.target.value)} error={errors.funcao} placeholder="Ex: Pedreiro, Electricista…" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <div className="flex gap-2">
              <PhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
              <input
                type="tel"
                value={form.telefone}
                onChange={e => f('telefone', e.target.value)}
                placeholder="912 345 678"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
          <Input
            label="Diária (€)"
            type="number"
            min="0"
            step="0.01"
            value={form.diaria ?? ''}
            onChange={e => f('diaria', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Ex: 250,00"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => f('ativo', !form.ativo)}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.ativo ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700">Trabalhador ativo</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteTrabalhador(deleteId); setDeleteId(null) } }}
        message={`O trabalhador "${trabalhadores.find(t => t.id === deleteId)?.nome}" será excluído permanentemente.`}
      />
    </div>
  )
}
