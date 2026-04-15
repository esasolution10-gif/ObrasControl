/**
 * whatsappService.ts
 *
 * Partilha de orçamentos via WhatsApp.
 *
 * LIMITAÇÃO TÉCNICA: A API pública do WhatsApp Web (wa.me) apenas suporta
 * texto pré-preenchido. Não é possível anexar ficheiros directamente a partir
 * de uma aplicação web sem passar por uma API oficial do WhatsApp Business.
 *
 * ESTRATÉGIA ADOPTADA:
 *   1. Gera e descarrega o PDF para o dispositivo do utilizador.
 *   2. Abre o WhatsApp (app ou web) com uma mensagem pré-preenchida.
 *   3. O utilizador anexa manualmente o PDF descarregado à conversa.
 *
 * Esta é a abordagem padrão adoptada por aplicações web que partilham
 * documentos via WhatsApp (ex. sistemas de faturação, e-commerce).
 */

import { Orcamento } from '@/types/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'

export function gerarMensagemWhatsApp(orcamento: Orcamento): string {
  const servico = orcamento.obraReferencia || orcamento.descricaoServico || 'serviço solicitado'
  return (
    `Olá ${orcamento.clienteNome},\n\n` +
    `Segue o orçamento nº *${orcamento.numero}* referente a "${servico}".\n\n` +
    `💰 *Valor total: ${formatCurrency(orcamento.total)}*\n` +
    `📅 Válido até: ${formatDate(orcamento.validadeData)}\n\n` +
    `O PDF foi descarregado e deverá ser enviado em anexo nesta conversa.\n\n` +
    `Fico à disposição para qualquer questão. 🙏`
  )
}

/**
 * Abre o WhatsApp com número e mensagem pré-preenchidos.
 * @param telefone — número no formato internacional, ex: "+351912345678"
 * @param mensagem — texto da mensagem
 */
export function abrirWhatsApp(telefone: string | undefined, mensagem: string): void {
  // Remove tudo excepto dígitos e o sinal +
  const numero = telefone ? telefone.replace(/[^\d+]/g, '') : ''
  const texto  = encodeURIComponent(mensagem)
  const url    = numero
    ? `https://wa.me/${numero}?text=${texto}`
    : `https://wa.me/?text=${texto}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
