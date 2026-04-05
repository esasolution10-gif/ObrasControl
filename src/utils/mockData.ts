import type { Obra, Trabalhador, LancamentoFinanceiro } from '@/types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── Obras ────────────────────────────────────────────────────────────────────

export const mockObras: Obra[] = [
  {
    id: 'obra-1',
    nome: 'Moradia Família Costa',
    localidade: 'Lisboa',
    descricao: 'Construção de moradia unifamiliar de 180m².',
    dataInicio: daysAgo(60),
    dataPrevisaoTermino: daysFromNow(120),
    status: 'em-andamento',
    observacoes: 'Cliente pediu acabamentos premium.',
    trabalhadoresIds: ['trab-1', 'trab-2', 'trab-3'],
    criadoEm: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'obra-2',
    nome: 'Remodelação Loja Baixa',
    localidade: 'Porto',
    descricao: 'Remodelação completa de espaço comercial de 60m².',
    dataInicio: daysAgo(20),
    dataPrevisaoTermino: daysFromNow(40),
    status: 'em-andamento',
    observacoes: '',
    trabalhadoresIds: ['trab-1', 'trab-4'],
    criadoEm: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'obra-3',
    nome: 'Armazém Industrial Setúbal',
    localidade: 'Setúbal',
    descricao: 'Armazém de 800m² para armazenagem industrial.',
    dataInicio: daysAgo(180),
    dataPrevisaoTermino: daysAgo(5),
    status: 'concluida',
    observacoes: 'Entregue dentro do prazo.',
    trabalhadoresIds: ['trab-2', 'trab-5'],
    criadoEm: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: 'obra-4',
    nome: 'Condomínio Quinta do Lago',
    localidade: 'Braga',
    descricao: '12 frações residenciais de alto padrão.',
    dataInicio: daysFromNow(15),
    dataPrevisaoTermino: daysFromNow(365),
    status: 'planejada',
    observacoes: 'A aguardar aprovação do projecto.',
    trabalhadoresIds: [],
    criadoEm: new Date().toISOString(),
  },
]

// ── Trabalhadores ────────────────────────────────────────────────────────────

export const mockTrabalhadores: Trabalhador[] = [
  {
    id: 'trab-1',
    nome: 'João Manuel Ferreira',
    funcao: 'Mestre de Obras',
    telefone: '912345678',
    diaria: 180,
    ativo: true,
    obrasIds: ['obra-1', 'obra-2'],
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'trab-2',
    nome: 'António José Silva',
    funcao: 'Pedreiro',
    telefone: '913456789',
    diaria: 120,
    ativo: true,
    obrasIds: ['obra-1', 'obra-3'],
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'trab-3',
    nome: 'Mariana Santos Rodrigues',
    funcao: 'Engenheira Civil',
    telefone: '914567890',
    diaria: 320,
    ativo: true,
    obrasIds: ['obra-1'],
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'trab-4',
    nome: 'Carlos Alberto Pinto',
    funcao: 'Carpinteiro',
    telefone: '915678901',
    diaria: 110,
    ativo: true,
    obrasIds: ['obra-2'],
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'trab-5',
    nome: 'Rui Miguel Oliveira',
    funcao: 'Electricista',
    telefone: '916789012',
    diaria: 150,
    ativo: false,
    obrasIds: ['obra-3'],
    criadoEm: new Date().toISOString(),
  },
]

// ── Lançamentos ──────────────────────────────────────────────────────────────

export const mockLancamentos: LancamentoFinanceiro[] = [
  // Obra 1
  { id: 'l-1',  obraId: 'obra-1', tipo: 'receita',  categoria: 'Adiantamento',          descricao: 'Adiantamento do contrato',   valor: 40000, data: daysAgo(60), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-2',  obraId: 'obra-1', tipo: 'receita',  categoria: 'Medição',                descricao: '1.ª Medição',                valor: 18000, data: daysAgo(30), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-3',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Material',               descricao: 'Cimento e areia',            valor:  6200, data: daysAgo(55), trabalhadorId: 'trab-1', observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-4',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Mão de Obra',            descricao: 'Pagamento semana 1',         valor:  3000, data: daysAgo(50), trabalhadorId: 'trab-2', observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-5',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Material',               descricao: 'Ferragens e tubagem',        valor:  4500, data: daysAgo(40), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-6',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Equipamento',            descricao: 'Aluguer de betoneira',       valor:   800, data: daysAgo(35), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-7',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Mão de Obra',            descricao: 'Pagamento semana 2',         valor:  3000, data: daysAgo(20), trabalhadorId: 'trab-2', observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-8',  obraId: 'obra-1', tipo: 'despesa',  categoria: 'Alimentação',            descricao: 'Refeições da equipa',        valor:   500, data: daysAgo(15), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  // Obra 2
  { id: 'l-9',  obraId: 'obra-2', tipo: 'receita',  categoria: 'Adiantamento',          descricao: 'Adiantamento inicial',       valor: 25000, data: daysAgo(20), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-10', obraId: 'obra-2', tipo: 'despesa',  categoria: 'Material',               descricao: 'Madeiras e painéis',         valor:  5600, data: daysAgo(18), trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-11', obraId: 'obra-2', tipo: 'despesa',  categoria: 'Mão de Obra',            descricao: 'Equipa semana 1',            valor:  2200, data: daysAgo(10), trabalhadorId: 'trab-4', observacoes: '', criadoEm: new Date().toISOString() },
  // Obra 3
  { id: 'l-12', obraId: 'obra-3', tipo: 'receita',  categoria: 'Saldo do Contrato',     descricao: 'Pagamento final da obra',    valor: 60000, data: daysAgo(5),  trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
  { id: 'l-13', obraId: 'obra-3', tipo: 'despesa',  categoria: 'Impostos e Taxas',       descricao: 'Liquidação de IVA',          valor:  1800, data: daysAgo(3),  trabalhadorId: null,     observacoes: '', criadoEm: new Date().toISOString() },
]
