'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Download, Eye, Copy, Trash2,
  Mail, MessageCircle, CheckCircle, XCircle, Send,
  Clock, FileText,
} from 'lucide-react'
import { useOrcamentoStore }  from '@/store/orcamentoStore'
import {
  Orcamento,
  StatusOrcamento,
  STATUS_ORCAMENTO_LABELS,
  STATUS_ORCAMENTO_COLORS,
} from '@/types/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  downloadPdfOrcamento,
  abrirPdfOrcamento,
} from '@/services/pdfService'
import {
  gerarDadosEmail,
  abrirEmailCliente,
  EmailData,
} from '@/services/emailService'
import {
  gerarMensagemWhatsApp,
  abrirWhatsApp,
} from '@/services/whatsappService'
import { EMPRESA_CONFIG } from '@/config/empresa'
import { cn } from '@/lib/utils'

// ── Transições de status permitidas ───────────────────────────────────────

const STATUS_TRANSITIONS: Record<StatusOrcamento, StatusOrcamento[]> = {
  rascunho:  ['enviado', 'cancelado'],
  enviado:   ['aprovado', 'rejeitado', 'cancelado'],
  aprovado:  ['cancelado'],
  rejeitado: ['rascunho'],
  cancelado: [],
}

// ── Página ─────────────────────────────────────────────────────────────────

export default function OrcamentoDetailPage({ params }: { params: { id: string } }) {
  const { id }      = params
  const router      = useRouter()
  const getById     = useOrcamentoStore(s => s.getById)
  const loading     = useOrcamentoStore(s => s.loading)
  const initialized = useOrcamentoStore(s => s.initialized)
  const { removeOrcamento, duplicar, updateStatus } = useOrcamentoStore()

  const orc = getById(id)

  const [pdfLoading,    setPdfLoading]    = useState(false)
  const [viewLoading,   setViewLoading]   = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [showEmail,     setShowEmail]     = useState(false)
  const [showWhatsApp,  setShowWhatsApp]  = useState(false)
  const [showStatus,    setShowStatus]    = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Email form state
  const [emailData,  setEmailData]  = useState<EmailData | null>(null)

  // WhatsApp message state
  const [waMsg, setWaMsg] = useState('')

  if (!initialized || loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!orc) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <FileText className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500 font-medium">Orçamento não encontrado.</p>
        <button onClick={() => router.push('/orcamentos')} className="text-sm text-orange-500 font-semibold hover:underline">
          Voltar à lista
        </button>
      </div>
    )
  }

  const nextStatuses = STATUS_TRANSITIONS[orc.status]
  const canEdit = orc.status !== 'cancelado'

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleDownloadPdf() {
    setPdfLoading(true)
    try { await downloadPdfOrcamento(orc!, EMPRESA_CONFIG) }
    finally { setPdfLoading(false) }
  }

  async function handleViewPdf() {
    setViewLoading(true)
    try { await abrirPdfOrcamento(orc!, EMPRESA_CONFIG) }
    finally { setViewLoading(false) }
  }

  function handleOpenEmail() {
    setEmailData(gerarDadosEmail(orc!))
    setShowEmail(true)
  }

  function handleSendEmail() {
    if (emailData) abrirEmailCliente(emailData)
    setShowEmail(false)
  }

  function handleOpenWhatsApp() {
    setWaMsg(gerarMensagemWhatsApp(orc!))
    setShowWhatsApp(true)
  }

  async function handleSendWhatsApp() {
    await downloadPdfOrcamento(orc!, EMPRESA_CONFIG)
    abrirWhatsApp(orc!.clienteTelefone, waMsg)
    setShowWhatsApp(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await removeOrcamento(orc!.id)
      router.push('/orcamentos')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDuplicar() {
    const novo = await duplicar(orc!.id)
    router.push(`/orcamentos/${novo.id}/editar`)
  }

  async function handleStatusChange(status: StatusOrcamento) {
    setStatusUpdating(true)
    try { await updateStatus(orc!.id, status) }
    finally { setStatusUpdating(false); setShowStatus(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push('/orcamentos')}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{orc.numero}</h1>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full',
              STATUS_ORCAMENTO_COLORS[orc.status],
            )}>
              {STATUS_ORCAMENTO_LABELS[orc.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Criado em {formatDate(orc.criadoEm)} · Válido até {formatDate(orc.validadeData)}
          </p>
        </div>
        {/* Actions — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => router.push(`/orcamentos/${orc.id}/editar`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
          <button
            onClick={handleViewPdf}
            disabled={viewLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <Eye className="w-4 h-4" />
            {viewLoading ? '…' : 'Visualizar PDF'}
          </button>
        </div>
      </div>

      {/* Acções rápidas — barra */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <ActionPill icon={Download} label={pdfLoading ? 'A gerar…' : 'Descarregar PDF'} onClick={handleDownloadPdf} disabled={pdfLoading} primary />
          <ActionPill icon={Mail}          label="Enviar por Email"     onClick={handleOpenEmail} />
          <ActionPill icon={MessageCircle} label="Enviar por WhatsApp"  onClick={handleOpenWhatsApp} />
          <ActionPill icon={Copy}          label="Duplicar"             onClick={handleDuplicar} />
          {nextStatuses.length > 0 && (
            <ActionPill icon={Clock} label="Mudar estado" onClick={() => setShowStatus(true)} />
          )}
          <ActionPill icon={Trash2} label="Excluir" onClick={() => setShowDelete(true)} danger />
        </div>
        {/* Mobile edit / view */}
        <div className="flex gap-2 mt-2 sm:hidden">
          {canEdit && (
            <button
              onClick={() => router.push(`/orcamentos/${orc.id}/editar`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" /> Editar
            </button>
          )}
          <button
            onClick={handleViewPdf}
            disabled={viewLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <Eye className="w-4 h-4" /> Visualizar PDF
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cliente */}
        <InfoCard title="Cliente">
          <InfoRow label="Nome"     value={orc.clienteNome} bold />
          <InfoRow label="Telefone" value={orc.clienteTelefone} />
          <InfoRow label="Email"    value={orc.clienteEmail} />
          <InfoRow label="NIF"      value={orc.clienteNif} />
          <InfoRow label="Morada"   value={orc.clienteMorada} />
          <InfoRow label="Cidade"   value={orc.clienteCidade} />
        </InfoCard>

        {/* Obra */}
        <InfoCard title="Obra / Serviço">
          <InfoRow label="Referência"  value={orc.obraReferencia} bold />
          <InfoRow label="Localidade"  value={orc.obraLocalidade} />
          <InfoRow label="Descrição"   value={orc.descricaoServico} />
          {orc.prazoExecucao && <InfoRow label="Prazo de execução" value={orc.prazoExecucao} />}
          {orc.condicoesPagamento && <InfoRow label="Cond. pagamento" value={orc.condicoesPagamento} />}
        </InfoCard>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700">Itens do Orçamento</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Un.</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço unit.</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Desc.%</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orc.itens.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-900">{item.descricao}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{item.quantidade}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{item.unidade}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(item.precoUnitario)}</td>
                  <td className="px-3 py-3 text-center text-gray-600">
                    {item.descontoItem > 0 ? `${item.descontoItem}%` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {orc.itens.map((item, i) => (
            <div key={i} className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-medium text-gray-900 flex-1">{item.descricao}</p>
                <p className="text-sm font-bold text-orange-600 ml-3">{formatCurrency(item.total)}</p>
              </div>
              <p className="text-xs text-gray-500">
                {item.quantidade} {item.unidade} × {formatCurrency(item.precoUnitario)}
                {item.descontoItem > 0 ? ` − ${item.descontoItem}% desc.` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="max-w-xs ml-auto space-y-2">
          <TotalLine label="Subtotal" value={formatCurrency(orc.subtotal)} />
          {orc.usarDescontoPercentual && orc.descontoPercentual > 0 ? (
            <TotalLine
              label={`Desconto (${orc.descontoPercentual}%)`}
              value={`- ${formatCurrency(orc.subtotal * orc.descontoPercentual / 100)}`}
              color="text-red-500"
            />
          ) : orc.descontoValor > 0 ? (
            <TotalLine label="Desconto" value={`- ${formatCurrency(orc.descontoValor)}`} color="text-red-500" />
          ) : null}
          {orc.impostosPercentual > 0 && (
            <TotalLine
              label={`IVA (${orc.impostosPercentual}%)`}
              value={formatCurrency((orc.subtotal - (orc.usarDescontoPercentual ? orc.subtotal * orc.descontoPercentual / 100 : orc.descontoValor)) * orc.impostosPercentual / 100)}
            />
          )}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-orange-600">{formatCurrency(orc.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      {orc.observacoes && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Observações</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{orc.observacoes}</p>
        </div>
      )}

      {/* Notas internas */}
      {orc.notasInternas && (
        <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-5">
          <h3 className="text-sm font-bold text-yellow-800 mb-2">⚠ Notas internas</h3>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">{orc.notasInternas}</p>
        </div>
      )}

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      {/* Modal: Mudar estado */}
      {showStatus && (
        <Modal title="Mudar estado do orçamento" onClose={() => setShowStatus(false)}>
          <p className="text-sm text-gray-500 mb-4">
            Estado actual: <strong>{STATUS_ORCAMENTO_LABELS[orc.status]}</strong>
          </p>
          <div className="space-y-2">
            {nextStatuses.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={statusUpdating}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border disabled:opacity-60',
                  s === 'aprovado'  ? 'border-green-200  bg-green-50  text-green-700  hover:bg-green-100'  :
                  s === 'rejeitado' ? 'border-red-200    bg-red-50    text-red-700    hover:bg-red-100'    :
                  s === 'enviado'   ? 'border-blue-200   bg-blue-50   text-blue-700   hover:bg-blue-100'   :
                  s === 'cancelado' ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' :
                                      'border-gray-200   bg-gray-50   text-gray-700   hover:bg-gray-100',
                )}
              >
                {s === 'aprovado'  && <CheckCircle className="w-4 h-4" />}
                {s === 'rejeitado' && <XCircle     className="w-4 h-4" />}
                {s === 'enviado'   && <Send         className="w-4 h-4" />}
                {s === 'cancelado' && <XCircle     className="w-4 h-4" />}
                {s === 'rascunho'  && <FileText    className="w-4 h-4" />}
                {STATUS_ORCAMENTO_LABELS[s]}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal: Email */}
      {showEmail && emailData && (
        <Modal title="Enviar por Email" onClose={() => setShowEmail(false)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              💡 O PDF será descarregado separadamente. Anexe-o manualmente ao email após clicar em &quot;Abrir email&quot;.
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Para</label>
              <input
                type="email"
                value={emailData.para}
                onChange={e => setEmailData(d => d ? { ...d, para: e.target.value } : d)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assunto</label>
              <input
                type="text"
                value={emailData.assunto}
                onChange={e => setEmailData(d => d ? { ...d, assunto: e.target.value } : d)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensagem</label>
              <textarea
                rows={7}
                value={emailData.mensagem}
                onChange={e => setEmailData(d => d ? { ...d, mensagem: e.target.value } : d)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmail(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Abrir email
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: WhatsApp */}
      {showWhatsApp && (
        <Modal title="Enviar por WhatsApp" onClose={() => setShowWhatsApp(false)}>
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700">
              📎 O PDF será descarregado automaticamente. Após abrir o WhatsApp, anexe o ficheiro descarregado à conversa.
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Número do destinatário
              </label>
              <input
                type="tel"
                value={orc.clienteTelefone ?? ''}
                readOnly
                placeholder="Sem número registado"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensagem</label>
              <textarea
                rows={7}
                value={waMsg}
                onChange={e => setWaMsg(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsApp(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF + Abrir WhatsApp
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar excluir */}
      {showDelete && (
        <Modal title="Excluir orçamento?" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-gray-500 mb-6">
            Tem a certeza? Esta acção não pode ser revertida.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {deleting ? 'A excluir…' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      <div className="p-5 space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({
  label, value, bold,
}: { label: string; value?: string; bold?: boolean }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 flex-shrink-0 w-28">{label}</span>
      <span className={cn('text-gray-900 flex-1', bold && 'font-semibold')}>{value}</span>
    </div>
  )
}

function TotalLine({
  label, value, color = 'text-gray-900',
}: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-medium', color)}>{value}</span>
    </div>
  )
}

interface ActionPillProps {
  icon:     React.ElementType
  label:    string
  onClick:  () => void
  primary?: boolean
  danger?:  boolean
  disabled?:boolean
}

function ActionPill({ icon: Icon, label, onClick, primary, danger, disabled }: ActionPillProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors border disabled:opacity-60',
        primary ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' :
        danger  ? 'text-red-500 border-red-200 hover:bg-red-50' :
                  'text-gray-600 border-gray-200 hover:bg-gray-50',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
