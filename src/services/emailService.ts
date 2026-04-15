/**
 * emailService.ts
 *
 * MVP: Abre o cliente de email instalado (mailto:) com o assunto e corpo
 * pré-preenchidos. O utilizador deve anexar o PDF manualmente.
 *
 * Pronto para futura integração via API /api/email (ex. Resend, SendGrid).
 * Quando o provider estiver configurado, chamar `enviarEmailViaApi`.
 */

import { Orcamento } from '@/types/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'

export interface EmailData {
  para:     string
  assunto:  string
  mensagem: string
}

export function gerarDadosEmail(orcamento: Orcamento): EmailData {
  const servico = orcamento.obraReferencia || orcamento.descricaoServico || 'Trabalho de pintura'
  return {
    para:    orcamento.clienteEmail ?? '',
    assunto: `Orçamento nº ${orcamento.numero} — ${servico}`,
    mensagem: [
      `Exmo(a). Sr(a). ${orcamento.clienteNome},`,
      '',
      `Conforme combinado, envio em anexo o orçamento nº ${orcamento.numero} referente ao serviço "${servico}".`,
      '',
      `Valor total: ${formatCurrency(orcamento.total)}`,
      `Válido até: ${formatDate(orcamento.validadeData)}`,
      '',
      orcamento.condicoesPagamento
        ? `Condições de pagamento: ${orcamento.condicoesPagamento}`
        : '',
      '',
      'Para qualquer questão ou esclarecimento, não hesite em contactar-nos.',
      '',
      'Com os melhores cumprimentos,',
      'VG Pinturas',
    ].filter(l => l !== undefined).join('\n'),
  }
}

/** Abre o cliente de email do sistema (não requer configuração de servidor). */
export function abrirEmailCliente(dados: EmailData): void {
  const subj = encodeURIComponent(dados.assunto)
  const body = encodeURIComponent(dados.mensagem)
  window.open(`mailto:${dados.para}?subject=${subj}&body=${body}`)
}

/**
 * Envia via API /api/email (requer RESEND_API_KEY configurado).
 * Retorna { sucesso, erro }.
 */
export async function enviarEmailViaApi(
  dados:       EmailData,
  pdfBase64:   string,
  nomeArquivo: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const res  = await fetch('/api/email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...dados, pdfBase64, nomeArquivo }),
    })
    const json = await res.json()
    if (!res.ok) return { sucesso: false, erro: json.erro ?? 'Erro ao enviar email.' }
    return { sucesso: true }
  } catch {
    return { sucesso: false, erro: 'Erro de ligação ao servidor.' }
  }
}
