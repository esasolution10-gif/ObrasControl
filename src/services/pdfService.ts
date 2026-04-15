/**
 * pdfService.ts — Geração de PDF para Orçamentos
 *
 * Usa jsPDF (v4) + jspdf-autotable (v5) importados dinamicamente
 * para evitar erros de SSR no Next.js.
 */

import { Orcamento, EmpresaConfig } from '@/types/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'

// ── Helpers de cor ─────────────────────────────────────────────────────────

type RGB = [number, number, number]

const C_ORANGE: RGB = [234, 88,  12]   // orange-600
const C_DARK:   RGB = [17,  24,  39]   // gray-900
const C_GRAY:   RGB = [107, 114, 128]  // gray-500
const C_LIGHT:  RGB = [245, 247, 250]  // gray-50 custom
const C_WHITE:  RGB = [255, 255, 255]
const C_BORDER: RGB = [229, 231, 235]  // gray-200
const C_RED:    RGB = [220, 38,  38]   // red-600

// ── Geração do PDF ─────────────────────────────────────────────────────────

export async function gerarPdfOrcamento(
  orcamento: Orcamento,
  empresa:   EmpresaConfig,
): Promise<unknown> {
  // Importação dinâmica — funciona apenas no browser
  const { jsPDF }        = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW  = doc.internal.pageSize.getWidth()   // 210
  const PH  = doc.internal.pageSize.getHeight()  // 297
  const ML  = 15
  const MR  = 15
  const CW  = PW - ML - MR   // 180

  let y = 0

  // ── Cabeçalho laranja ────────────────────────────────────────────────────
  doc.setFillColor(C_ORANGE[0], C_ORANGE[1], C_ORANGE[2])
  doc.rect(0, 0, PW, 46, 'F')

  // Nome da empresa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
  doc.text(empresa.nome, ML, 17)

  // Dados da empresa (pequenos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 237, 213)  // orange-100
  const compLines = [
    empresa.morada,
    empresa.telefone,
    empresa.email,
    empresa.nif ? `NIF: ${empresa.nif}` : null,
  ].filter(Boolean) as string[]
  compLines.forEach((line, i) => doc.text(line, ML, 24 + i * 4))

  // Título "ORÇAMENTO" (direita)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
  doc.text('ORÇAMENTO', PW - MR, 15, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 237, 213)
  doc.text(`Nº ${orcamento.numero}`,                               PW - MR, 22, { align: 'right' })
  doc.text(`Data: ${formatDate(orcamento.criadoEm)}`,              PW - MR, 28, { align: 'right' })
  doc.text(`Válido até: ${formatDate(orcamento.validadeData)}`,     PW - MR, 34, { align: 'right' })

  y = 54

  // ── Caixas Cliente + Obra ─────────────────────────────────────────────────
  const halfW = (CW - 5) / 2
  const boxH  = 38

  // Caixa Cliente
  doc.setFillColor(C_LIGHT[0], C_LIGHT[1], C_LIGHT[2])
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
  doc.setLineWidth(0.15)
  doc.roundedRect(ML, y, halfW, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(C_ORANGE[0], C_ORANGE[1], C_ORANGE[2])
  doc.text('CLIENTE', ML + 4, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2])
  const nomeLines = doc.splitTextToSize(orcamento.clienteNome, halfW - 8)
  doc.text(nomeLines[0], ML + 4, y + 12.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2])
  let cy = y + 18
  const clienteInfos = [
    orcamento.clienteMorada,
    orcamento.clienteCidade,
    orcamento.clienteTelefone ? `Tel: ${orcamento.clienteTelefone}` : null,
    orcamento.clienteEmail,
    orcamento.clienteNif ? `NIF: ${orcamento.clienteNif}` : null,
  ].filter(Boolean) as string[]
  clienteInfos.slice(0, 4).forEach(l => { doc.text(l, ML + 4, cy); cy += 4 })

  // Caixa Obra
  const obraX = ML + halfW + 5
  doc.setFillColor(C_LIGHT[0], C_LIGHT[1], C_LIGHT[2])
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
  doc.roundedRect(obraX, y, halfW, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(C_ORANGE[0], C_ORANGE[1], C_ORANGE[2])
  doc.text('OBRA / SERVIÇO', obraX + 4, y + 6)

  let oy = y + 12.5
  if (orcamento.obraReferencia) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2])
    doc.text(doc.splitTextToSize(orcamento.obraReferencia, halfW - 8)[0], obraX + 4, oy)
    oy += 6
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2])
  if (orcamento.obraLocalidade) {
    doc.text(`Local: ${orcamento.obraLocalidade}`, obraX + 4, oy)
    oy += 4
  }
  if (orcamento.descricaoServico) {
    const dsLines = doc.splitTextToSize(orcamento.descricaoServico, halfW - 8)
    doc.text(dsLines.slice(0, 3) as string[], obraX + 4, oy)
  }

  y += boxH + 8

  // ── Tabela de itens ───────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Descrição', 'Qtd', 'Un.', 'Preço Unit.', 'Desc.', 'Total']],
    body: orcamento.itens.map(item => [
      item.descricao,
      String(item.quantidade).replace('.', ','),
      item.unidade,
      formatCurrency(item.precoUnitario),
      item.descontoItem > 0 ? `${item.descontoItem}%` : '—',
      formatCurrency(item.total),
    ]),
    headStyles: {
      fillColor:  [C_ORANGE[0], C_ORANGE[1], C_ORANGE[2]],
      textColor:  [C_WHITE[0],  C_WHITE[1],  C_WHITE[2]],
      fontStyle:  'bold',
      fontSize:   8.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize:    8,
      textColor:   [C_DARK[0], C_DARK[1], C_DARK[2]],
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: [C_LIGHT[0], C_LIGHT[1], C_LIGHT[2]] },
    columnStyles: {
      0: { cellWidth: 'auto', minCellWidth: 50 },
      1: { cellWidth: 16,  halign: 'center' },
      2: { cellWidth: 14,  halign: 'center' },
      3: { cellWidth: 28,  halign: 'right' },
      4: { cellWidth: 14,  halign: 'center' },
      5: { cellWidth: 28,  halign: 'right', fontStyle: 'bold' },
    },
    theme: 'plain',
    tableLineColor: [C_BORDER[0], C_BORDER[1], C_BORDER[2]],
    tableLineWidth: 0.15,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  // ── Totais ────────────────────────────────────────────────────────────────
  const totW = 82
  const totX = PW - MR - totW

  const desconto = orcamento.usarDescontoPercentual
    ? orcamento.subtotal * (orcamento.descontoPercentual / 100)
    : orcamento.descontoValor

  const impostos = orcamento.impostosPercentual > 0
    ? (orcamento.subtotal - desconto) * (orcamento.impostosPercentual / 100)
    : 0

  function totLine(label: string, value: string, color: RGB = C_DARK) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2])
    doc.text(label, totX, y)
    doc.setTextColor(color[0], color[1], color[2])
    doc.text(value, PW - MR, y, { align: 'right' })
    y += 6.5
  }

  totLine('Subtotal:', formatCurrency(orcamento.subtotal))
  if (desconto > 0) {
    const lbl = orcamento.usarDescontoPercentual
      ? `Desconto (${orcamento.descontoPercentual}%):`
      : 'Desconto:'
    totLine(lbl, `- ${formatCurrency(desconto)}`, C_RED)
  }
  if (impostos > 0) {
    totLine(`IVA (${orcamento.impostosPercentual}%):`, formatCurrency(impostos))
  }

  // Caixa Total
  doc.setFillColor(C_ORANGE[0], C_ORANGE[1], C_ORANGE[2])
  doc.roundedRect(totX - 2, y - 1, totW + 2, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2])
  doc.text('TOTAL:', totX + 2, y + 8)
  doc.text(formatCurrency(orcamento.total), PW - MR - 2, y + 8, { align: 'right' })
  y += 20

  // ── Condições comerciais ──────────────────────────────────────────────────
  const conditions = [
    orcamento.prazoExecucao       ? { label: 'Prazo de execução',     val: orcamento.prazoExecucao }       : null,
    orcamento.condicoesPagamento  ? { label: 'Condições de pagamento', val: orcamento.condicoesPagamento }  : null,
    orcamento.observacoes         ? { label: 'Observações',            val: orcamento.observacoes }         : null,
  ].filter(Boolean) as { label: string; val: string }[]

  if (conditions.length > 0) {
    if (y > PH - 65) { doc.addPage(); y = 20 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(C_ORANGE[0], C_ORANGE[1], C_ORANGE[2])
    doc.text('CONDIÇÕES COMERCIAIS', ML, y)
    y += 5

    // Calcular altura necessária
    let tmpH = 6
    conditions.forEach(c => {
      tmpH += 5 + doc.splitTextToSize(c.val, CW - 8).length * 4.5 + 2
    })

    doc.setFillColor(C_LIGHT[0], C_LIGHT[1], C_LIGHT[2])
    doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
    doc.setLineWidth(0.15)
    doc.roundedRect(ML, y, CW, tmpH, 2, 2, 'FD')

    let iy = y + 5
    conditions.forEach(c => {
      const lines = doc.splitTextToSize(c.val, CW - 8) as string[]

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2])
      doc.text(`${c.label}:`, ML + 4, iy)
      iy += 4.5

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2])
      doc.text(lines, ML + 4, iy)
      iy += lines.length * 4.5 + 3
    })

    y = y + tmpH + 8
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const footY = PH - 14
  doc.setDrawColor(C_BORDER[0], C_BORDER[1], C_BORDER[2])
  doc.setLineWidth(0.25)
  doc.line(ML, footY - 3, PW - MR, footY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2])

  const footL = [empresa.nome, empresa.morada].filter(Boolean).join('  |  ')
  const footR = [empresa.telefone, empresa.email].filter(Boolean).join('  |  ')
  doc.text(footL,   ML,        footY + 2)
  doc.text(footR,   PW - MR,   footY + 2, { align: 'right' })
  if (empresa.nif) doc.text(`NIF: ${empresa.nif}`, PW / 2, footY + 2, { align: 'center' })

  return doc
}

// ── Download ───────────────────────────────────────────────────────────────

export function nomeFicheiroPdf(orcamento: Orcamento): string {
  const cliente = orcamento.clienteNome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 20)
  const data    = orcamento.criadoEm.slice(0, 10).replace(/-/g, '')
  return `Orcamento_${orcamento.numero}_${cliente}_${data}.pdf`
}

export async function downloadPdfOrcamento(
  orcamento: Orcamento,
  empresa:   EmpresaConfig,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await gerarPdfOrcamento(orcamento, empresa) as any
  doc.save(nomeFicheiroPdf(orcamento))
}

export async function abrirPdfOrcamento(
  orcamento: Orcamento,
  empresa:   EmpresaConfig,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await gerarPdfOrcamento(orcamento, empresa) as any
  const url = doc.output('bloburl') as string
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function getPdfBase64(
  orcamento: Orcamento,
  empresa:   EmpresaConfig,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await gerarPdfOrcamento(orcamento, empresa) as any
  return doc.output('datauristring') as string
}
