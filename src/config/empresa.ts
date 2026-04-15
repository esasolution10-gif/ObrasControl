import { EmpresaConfig } from '@/types/orcamento'

/**
 * Configuração da empresa utilizada nos PDFs de orçamento.
 * Edite este ficheiro para actualizar os dados da empresa.
 * No futuro, estes dados serão geridos numa página de "Configurações".
 */
export const EMPRESA_CONFIG: EmpresaConfig = {
  nome:     'VG Pinturas',
  telefone: '+351 912 345 678',
  email:    'geral@vgpinturas.pt',
  morada:   'Lisboa, Portugal',
  nif:      'PT 123456789',
  // logoUrl: '/logo.png',  // descomente e coloque o logo em /public
}
