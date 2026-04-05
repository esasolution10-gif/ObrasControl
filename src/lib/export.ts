import type { Obra, Trabalhador, LancamentoFinanceiro } from '@/types'
import { formatDate, formatCurrency, slugify } from '@/utils/format'
import * as XLSX from 'xlsx'

export function exportObraToXLSX(
  obra: Obra,
  trabalhadores: Trabalhador[],
  lancamentos: LancamentoFinanceiro[],
  allTrabalhadores: Trabalhador[]
): void {
  const wb = XLSX.utils.book_new()

  // ── Aba 1: Dados da Obra ─────────────────────────────────────────────────
  const dadosObra = [
    ['RELATÓRIO DA OBRA'],
    [],
    ['Campo',               'Valor'],
    ['Nome',                obra.nome],
    ['Localidade',          obra.localidade],
    ['Status',              obra.status],
    ['Início',              formatDate(obra.dataInicio)],
    ['Previsão de Término', formatDate(obra.dataPrevisaoTermino)],
    ['Descrição',           obra.descricao || '-'],
    ['Observações',         obra.observacoes || '-'],
  ]
  const wsObra = XLSX.utils.aoa_to_sheet(dadosObra)
  wsObra['!cols'] = [{ wch: 24 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsObra, 'Dados da Obra')

  // ── Aba 2: Equipe ─────────────────────────────────────────────────────────
  const equipeRows = [
    ['Nome', 'Função', 'Telefone', 'Diária (€)', 'Status'],
    ...trabalhadores.map(t => [
      t.nome,
      t.funcao,
      t.telefone || '-',
      t.diaria ?? '-',
      t.ativo ? 'Ativo' : 'Inativo',
    ]),
  ]
  const wsEquipe = XLSX.utils.aoa_to_sheet(equipeRows.length > 1 ? equipeRows : [equipeRows[0], ['Nenhum trabalhador vinculado']])
  wsEquipe['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsEquipe, 'Equipe')

  // ── Aba 3: Lançamentos ───────────────────────────────────────────────────
  const totalReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const totalDespesas = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const lancamentoRows = [
    ['Data', 'Tipo', 'Categoria', 'Descrição', 'Trabalhador', 'Valor (€)', 'Observações'],
    ...lancamentos
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(l => {
        const trab = l.trabalhadorId ? allTrabalhadores.find(t => t.id === l.trabalhadorId) : null
        return [
          formatDate(l.data),
          l.tipo === 'receita' ? 'Receita' : 'Despesa',
          l.categoria,
          l.descricao,
          trab?.nome ?? '-',
          l.valor,
          l.observacoes || '-',
        ]
      }),
    [],
    ['', '', '', '', 'Total Receitas', totalReceitas, ''],
    ['', '', '', '', 'Total Despesas', totalDespesas, ''],
    ['', '', '', '', 'Saldo Final',    saldo,          ''],
  ]
  const wsLancamentos = XLSX.utils.aoa_to_sheet(lancamentoRows)
  wsLancamentos['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 30 }, { wch: 22 }, { wch: 14 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, wsLancamentos, 'Lançamentos')

  // ── Download ─────────────────────────────────────────────────────────────
  const nomeArquivo = `Relatorio_Obra_${slugify(obra.nome)}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`
  XLSX.writeFile(wb, nomeArquivo)
}
