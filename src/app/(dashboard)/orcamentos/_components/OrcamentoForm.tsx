'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, ChevronDown, ArrowLeft, Save, FileDown,
} from 'lucide-react'
import { useObraStore }      from '@/store/obraStore'
import { useOrcamentoStore } from '@/store/orcamentoStore'
import {
  Orcamento,
  OrcamentoFormData,
  ItemOrcamentoInput,
  StatusOrcamento,
  UNIDADES_ITEM,
  STATUS_ORCAMENTO_LABELS,
} from '@/types/orcamento'
import {
  calcItemTotal,
  recalcularOrcamento,
} from '@/utils/orcamentoCalc'
import { formatCurrency, todayISO } from '@/utils/format'
import { downloadPdfOrcamento } from '@/services/pdfService'
import { EMPRESA_CONFIG }       from '@/config/empresa'
import { cn } from '@/lib/utils'

// ── Tipos locais ────────────────────────────────────────────────────────────

interface Props {
  orcamento?: Orcamento   // undefined = criar, definido = editar
}

const STATUS_EDITAVEIS: StatusOrcamento[] = ['rascunho', 'enviado', 'aprovado', 'rejeitado', 'cancelado']

function defaultForm(orc?: Orcamento): Omit<OrcamentoFormData, 'itens'> {
  if (orc) {
    return {
      status:                 orc.status,
      clienteNome:            orc.clienteNome,
      clienteTelefone:        orc.clienteTelefone        ?? '',
      clienteEmail:           orc.clienteEmail           ?? '',
      clienteNif:             orc.clienteNif             ?? '',
      clienteMorada:          orc.clienteMorada          ?? '',
      clienteCidade:          orc.clienteCidade          ?? '',
      obraId:                 orc.obraId                 ?? '',
      obraReferencia:         orc.obraReferencia         ?? '',
      obraLocalidade:         orc.obraLocalidade         ?? '',
      descricaoServico:       orc.descricaoServico       ?? '',
      descontoValor:          orc.descontoValor,
      descontoPercentual:     orc.descontoPercentual,
      usarDescontoPercentual: orc.usarDescontoPercentual,
      impostosPercentual:     orc.impostosPercentual,
      prazoExecucao:          orc.prazoExecucao          ?? '',
      validadeData:           orc.validadeData,
      condicoesPagamento:     orc.condicoesPagamento     ?? '',
      observacoes:            orc.observacoes            ?? '',
      notasInternas:          orc.notasInternas          ?? '',
    }
  }
  // Validade padrão: hoje + 30 dias
  const validade = new Date()
  validade.setDate(validade.getDate() + 30)
  const validadeISO = validade.toISOString().slice(0, 10)

  return {
    status:                 'rascunho',
    clienteNome:            '',
    clienteTelefone:        '',
    clienteEmail:           '',
    clienteNif:             '',
    clienteMorada:          '',
    clienteCidade:          '',
    obraId:                 '',
    obraReferencia:         '',
    obraLocalidade:         '',
    descricaoServico:       '',
    descontoValor:          0,
    descontoPercentual:     0,
    usarDescontoPercentual: false,
    impostosPercentual:     0,
    prazoExecucao:          '',
    validadeData:           validadeISO,
    condicoesPagamento:     '',
    observacoes:            '',
    notasInternas:          '',
  }
}

function defaultItens(orc?: Orcamento): ItemOrcamentoInput[] {
  if (!orc) return []
  return orc.itens.map(i => ({
    ordem:         i.ordem,
    descricao:     i.descricao,
    quantidade:    i.quantidade,
    unidade:       i.unidade,
    precoUnitario: i.precoUnitario,
    descontoItem:  i.descontoItem,
  }))
}

// ── Componente principal ───────────────────────────────────────────────────

export default function OrcamentoForm({ orcamento }: Props) {
  const router   = useRouter()
  const isEdit   = !!orcamento
  const { obras } = useObraStore()
  const { addOrcamento, editOrcamento } = useOrcamentoStore()

  const [form,  setForm]  = useState<Omit<OrcamentoFormData, 'itens'>>(defaultForm(orcamento))
  const [itens, setItens] = useState<ItemOrcamentoInput[]>(defaultItens(orcamento))
  const [erros, setErros] = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)

  // ── Resumo calculado ────────────────────────────────────────────────────
  const resumo = useMemo(() => recalcularOrcamento(
    itens,
    form.descontoValor,
    form.descontoPercentual,
    form.usarDescontoPercentual,
    form.impostosPercentual,
  ), [itens, form.descontoValor, form.descontoPercentual, form.usarDescontoPercentual, form.impostosPercentual])

  // ── Helpers de formulário ────────────────────────────────────────────────
  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
    if (erros[k]) setErros(e => ({ ...e, [k]: '' }))
  }

  // Quando selecciona uma obra, preenche referência e localidade automaticamente
  function handleObraSelect(obraId: string) {
    setField('obraId', obraId)
    if (obraId) {
      const obra = obras.find(o => o.id === obraId)
      if (obra) {
        setField('obraReferencia', obra.nome)
        setField('obraLocalidade', obra.localidade)
      }
    }
  }

  // ── Gestão de itens ──────────────────────────────────────────────────────
  const addItem = useCallback(() => {
    setItens(prev => [...prev, {
      ordem:         prev.length,
      descricao:     '',
      quantidade:    1,
      unidade:       'un',
      precoUnitario: 0,
      descontoItem:  0,
    }])
  }, [])

  const updateItem = useCallback((idx: number, field: keyof ItemOrcamentoInput, val: unknown) => {
    setItens(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
    if (erros.itens) setErros(e => ({ ...e, itens: '' }))
  }, [erros.itens])

  const removeItem = useCallback((idx: number) => {
    setItens(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, ordem: i })))
  }, [])

  // ── Validação ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.clienteNome.trim()) e.clienteNome = 'Nome do cliente é obrigatório.'
    if (!form.validadeData)       e.validadeData = 'Validade é obrigatória.'
    if (itens.length === 0)       e.itens = 'Adicione pelo menos um item.'
    itens.forEach((item, i) => {
      if (!item.descricao.trim())    e[`item_${i}_desc`]  = 'Descrição obrigatória.'
      if (item.quantidade <= 0)      e[`item_${i}_qtd`]   = 'Qtd > 0.'
      if (item.precoUnitario < 0)    e[`item_${i}_preco`] = 'Preço inválido.'
    })
    setErros(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSave(gerar_pdf = false) {
    if (!validate()) return
    setSaving(true)
    if (gerar_pdf) setSavingPdf(true)
    try {
      const formData: OrcamentoFormData = { ...form, itens }
      let saved: Orcamento
      if (isEdit) {
        saved = await editOrcamento(orcamento!.id, formData)
      } else {
        saved = await addOrcamento(formData)
      }
      if (gerar_pdf) {
        await downloadPdfOrcamento(saved, EMPRESA_CONFIG)
      }
      router.push(`/orcamentos/${saved.id}`)
    } catch (err) {
      console.error(err)
      setErros({ _: 'Erro ao guardar. Tente novamente.' })
    } finally {
      setSaving(false)
      setSavingPdf(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? `Editar orçamento ${orcamento!.numero}` : 'Novo Orçamento'}
          </h1>
          <p className="text-sm text-gray-500">Preencha os dados do orçamento</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Coluna principal ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* ── Estado e Validade ─────────────────────────────────────── */}
          <Section title="Estado e Validade">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value as StatusOrcamento)}
                  className={inputCls()}
                >
                  {STATUS_EDITAVEIS.map(s => (
                    <option key={s} value={s}>{STATUS_ORCAMENTO_LABELS[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Válido até *" error={erros.validadeData}>
                <input
                  type="date"
                  value={form.validadeData}
                  onChange={e => setField('validadeData', e.target.value)}
                  className={inputCls(!!erros.validadeData)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Dados do Cliente ─────────────────────────────────────── */}
          <Section title="Dados do Cliente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Nome do cliente *" error={erros.clienteNome}>
                  <input
                    type="text"
                    value={form.clienteNome}
                    onChange={e => setField('clienteNome', e.target.value)}
                    placeholder="Nome completo ou empresa"
                    className={inputCls(!!erros.clienteNome)}
                  />
                </Field>
              </div>
              <Field label="Telefone">
                <input
                  type="tel"
                  value={form.clienteTelefone}
                  onChange={e => setField('clienteTelefone', e.target.value)}
                  placeholder="+351 912 345 678"
                  className={inputCls()}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.clienteEmail}
                  onChange={e => setField('clienteEmail', e.target.value)}
                  placeholder="email@exemplo.pt"
                  className={inputCls()}
                />
              </Field>
              <Field label="NIF / CPF">
                <input
                  type="text"
                  value={form.clienteNif}
                  onChange={e => setField('clienteNif', e.target.value)}
                  placeholder="123456789"
                  className={inputCls()}
                />
              </Field>
              <Field label="Cidade">
                <input
                  type="text"
                  value={form.clienteCidade}
                  onChange={e => setField('clienteCidade', e.target.value)}
                  placeholder="Lisboa"
                  className={inputCls()}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Morada">
                  <input
                    type="text"
                    value={form.clienteMorada}
                    onChange={e => setField('clienteMorada', e.target.value)}
                    placeholder="Rua, nº, código postal"
                    className={inputCls()}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Dados da Obra ─────────────────────────────────────────── */}
          <Section title="Obra / Serviço">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Vincular a obra existente (opcional)">
                  <select
                    value={form.obraId}
                    onChange={e => handleObraSelect(e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">— Sem vinculação —</option>
                    {obras.map(o => (
                      <option key={o.id} value={o.id}>{o.nome} ({o.localidade})</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Referência da obra / serviço">
                <input
                  type="text"
                  value={form.obraReferencia}
                  onChange={e => setField('obraReferencia', e.target.value)}
                  placeholder="Ex: Pintura Apartamento T3"
                  className={inputCls()}
                />
              </Field>
              <Field label="Localidade da obra">
                <input
                  type="text"
                  value={form.obraLocalidade}
                  onChange={e => setField('obraLocalidade', e.target.value)}
                  placeholder="Ex: Lisboa"
                  className={inputCls()}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descrição geral do serviço">
                  <textarea
                    value={form.descricaoServico}
                    onChange={e => setField('descricaoServico', e.target.value)}
                    rows={3}
                    placeholder="Descreva brevemente o serviço a realizar…"
                    className={inputCls()}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Itens ────────────────────────────────────────────────── */}
          <Section title="Itens do Orçamento">
            {erros.itens && (
              <p className="text-xs text-red-500 mb-3 -mt-1">{erros.itens}</p>
            )}
            <div className="space-y-3">
              {itens.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                  <p className="text-sm text-gray-400 mb-3">Nenhum item adicionado</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-orange-500 font-semibold hover:underline"
                  >
                    + Adicionar primeiro item
                  </button>
                </div>
              ) : (
                <>
                  {/* Cabeçalho da tabela — apenas desktop */}
                  <div className="hidden lg:grid grid-cols-[1fr_80px_80px_110px_80px_100px_36px] gap-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <span>Descrição</span>
                    <span className="text-center">Qtd</span>
                    <span className="text-center">Un.</span>
                    <span className="text-right">Preço unit.</span>
                    <span className="text-center">Desc.%</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>
                  {itens.map((item, idx) => (
                    <ItemRow
                      key={idx}
                      item={item}
                      idx={idx}
                      erros={erros}
                      onChange={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </>
              )}
            </div>
            {itens.length > 0 && (
              <button
                type="button"
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar item
              </button>
            )}
          </Section>

          {/* ── Descontos e Impostos ─────────────────────────────────── */}
          <Section title="Descontos e Impostos">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Tipo de desconto">
                <div className="flex gap-3 mt-1">
                  {[
                    { label: 'Valor (€)', val: false },
                    { label: 'Percentual (%)', val: true },
                  ].map(opt => (
                    <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoDesconto"
                        checked={form.usarDescontoPercentual === opt.val}
                        onChange={() => setField('usarDescontoPercentual', opt.val)}
                        className="accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label={form.usarDescontoPercentual ? 'Desconto (%)' : 'Desconto (€)'}>
                <input
                  type="number"
                  min="0"
                  step={form.usarDescontoPercentual ? '0.1' : '0.01'}
                  value={form.usarDescontoPercentual ? form.descontoPercentual : form.descontoValor}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0
                    if (form.usarDescontoPercentual) setField('descontoPercentual', v)
                    else setField('descontoValor', v)
                  }}
                  className={inputCls()}
                />
              </Field>
              <Field label="IVA (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.impostosPercentual}
                  onChange={e => setField('impostosPercentual', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={inputCls()}
                />
              </Field>
            </div>
          </Section>

          {/* ── Condições Comerciais ─────────────────────────────────── */}
          <Section title="Condições Comerciais">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Prazo de execução">
                <input
                  type="text"
                  value={form.prazoExecucao}
                  onChange={e => setField('prazoExecucao', e.target.value)}
                  placeholder="Ex: 15 dias úteis"
                  className={inputCls()}
                />
              </Field>
              <Field label="Condições de pagamento">
                <input
                  type="text"
                  value={form.condicoesPagamento}
                  onChange={e => setField('condicoesPagamento', e.target.value)}
                  placeholder="Ex: 50% adiantamento, 50% na conclusão"
                  className={inputCls()}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Observações (visíveis no PDF)">
                  <textarea
                    rows={3}
                    value={form.observacoes}
                    onChange={e => setField('observacoes', e.target.value)}
                    placeholder="Observações ou notas para o cliente…"
                    className={inputCls()}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Notas internas (não aparecem no PDF)">
                  <textarea
                    rows={2}
                    value={form.notasInternas}
                    onChange={e => setField('notasInternas', e.target.value)}
                    placeholder="Notas apenas para uso interno…"
                    className={cn(inputCls(), 'bg-yellow-50')}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Erro global */}
          {erros._ && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
              {erros._}
            </div>
          )}

          {/* Botões (mobile) */}
          <div className="xl:hidden">
            <ActionButtons
              saving={saving}
              savingPdf={savingPdf}
              onSave={() => handleSave(false)}
              onSavePdf={() => handleSave(true)}
            />
          </div>
        </div>

        {/* ── Painel lateral — Resumo + Botões (desktop) ─────────────── */}
        <div className="xl:w-72 space-y-5">
          <div className="xl:sticky xl:top-6 space-y-5">
            {/* Resumo financeiro */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Resumo Financeiro</h3>
              <div className="space-y-2.5">
                <ResumoLine label="Subtotal"  value={resumo.subtotal} />
                {resumo.desconto > 0 && (
                  <ResumoLine label="Desconto" value={-resumo.desconto} color="text-red-500" />
                )}
                {resumo.impostos > 0 && (
                  <ResumoLine label={`IVA (${form.impostosPercentual}%)`} value={resumo.impostos} />
                )}
                <div className="border-t border-gray-100 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatCurrency(resumo.total)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{itens.length} item(s)</p>
            </div>

            {/* Botões (desktop) */}
            <div className="hidden xl:block">
              <ActionButtons
                saving={saving}
                savingPdf={savingPdf}
                onSave={() => handleSave(false)}
                onSavePdf={() => handleSave(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputCls(err = false) {
  return cn(
    'w-full px-3 py-2.5 text-sm border rounded-xl bg-white',
    'focus:outline-none focus:ring-2 focus:ring-orange-400',
    err ? 'border-red-400' : 'border-gray-200',
  )
}

function ResumoLine({ label, value, color = 'text-gray-700' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-medium', color)}>{formatCurrency(Math.abs(value))}</span>
    </div>
  )
}

function ActionButtons({
  saving, savingPdf, onSave, onSavePdf,
}: { saving: boolean; savingPdf: boolean; onSave: () => void; onSavePdf: () => void }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onSavePdf}
        disabled={saving || savingPdf}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
      >
        <FileDown className="w-4 h-4" />
        {savingPdf ? 'A gerar PDF…' : 'Guardar e gerar PDF'}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || savingPdf}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving && !savingPdf ? 'A guardar…' : 'Guardar como rascunho'}
      </button>
    </div>
  )
}

// ── Linha de item ──────────────────────────────────────────────────────────

interface ItemRowProps {
  item:     ItemOrcamentoInput
  idx:      number
  erros:    Record<string, string>
  onChange: (idx: number, field: keyof ItemOrcamentoInput, val: unknown) => void
  onRemove: (idx: number) => void
}

function ItemRow({ item, idx, erros, onChange, onRemove }: ItemRowProps) {
  const total = calcItemTotal(item.quantidade, item.precoUnitario, item.descontoItem)

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      {/* Desktop: grid row */}
      <div className="hidden lg:grid grid-cols-[1fr_80px_80px_110px_80px_100px_36px] gap-2 items-center">
        <input
          type="text"
          value={item.descricao}
          onChange={e => onChange(idx, 'descricao', e.target.value)}
          placeholder="Descrição do item"
          className={cn(itemInputCls(), erros[`item_${idx}_desc`] && 'border-red-400')}
        />
        <input
          type="number"
          min="0"
          step="0.001"
          value={item.quantidade}
          onChange={e => onChange(idx, 'quantidade', parseFloat(e.target.value) || 0)}
          className={cn(itemInputCls('center'), erros[`item_${idx}_qtd`] && 'border-red-400')}
        />
        <select
          value={item.unidade}
          onChange={e => onChange(idx, 'unidade', e.target.value)}
          className={cn(itemInputCls('center'), 'px-1')}
        >
          {UNIDADES_ITEM.map(u => <option key={u}>{u}</option>)}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.precoUnitario}
          onChange={e => onChange(idx, 'precoUnitario', parseFloat(e.target.value) || 0)}
          className={cn(itemInputCls('right'), erros[`item_${idx}_preco`] && 'border-red-400')}
        />
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={item.descontoItem}
          onChange={e => onChange(idx, 'descontoItem', parseFloat(e.target.value) || 0)}
          className={itemInputCls('center')}
        />
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile: card */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-start justify-between gap-2">
          <input
            type="text"
            value={item.descricao}
            onChange={e => onChange(idx, 'descricao', e.target.value)}
            placeholder="Descrição do item"
            className={cn(itemInputCls(), 'flex-1', erros[`item_${idx}_desc`] && 'border-red-400')}
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-gray-400 mb-1">Qtd</p>
            <input
              type="number"
              min="0"
              step="0.001"
              value={item.quantidade}
              onChange={e => onChange(idx, 'quantidade', parseFloat(e.target.value) || 0)}
              className={itemInputCls('center')}
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Unidade</p>
            <select
              value={item.unidade}
              onChange={e => onChange(idx, 'unidade', e.target.value)}
              className={cn(itemInputCls(), 'px-1')}
            >
              {UNIDADES_ITEM.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Desc.%</p>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={item.descontoItem}
              onChange={e => onChange(idx, 'descontoItem', parseFloat(e.target.value) || 0)}
              className={itemInputCls('center')}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Preço unitário</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.precoUnitario}
              onChange={e => onChange(idx, 'precoUnitario', parseFloat(e.target.value) || 0)}
              className={itemInputCls('right')}
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-base font-bold text-orange-600 pr-1">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function itemInputCls(align: 'left' | 'center' | 'right' = 'left') {
  return cn(
    'w-full px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white',
    'focus:outline-none focus:ring-2 focus:ring-orange-400',
    align === 'center' && 'text-center',
    align === 'right'  && 'text-right',
  )
}
