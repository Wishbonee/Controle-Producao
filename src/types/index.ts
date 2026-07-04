export type StatusProducao =
  | 'Em Produção'
  | 'ATRASADO'
  | 'Entregue'
  | 'Enviado'
  | 'Aguardando'
  | 'Cancelado';

export type StatusPagamento = 'PAGO' | 'PENDENTE' | 'PARCIAL';
export type Perfil = 'admin' | 'producao';
export type ViewName =
  | 'dashboard'
  | 'pedidos'
  | 'kanban'
  | 'calendario'
  | 'urgentes'
  | 'clientes'
  | 'relatorios'
  | 'configuracoes';

/** Etapas internas de produção (aplicam-se a pedidos Em Produção/Atrasados) */
export const ETAPAS = [
  'Aguardando arte',
  'Corte',
  'Personalização',
  'Montagem',
  'Acabamento',
  'Pronto p/ envio',
] as const;
export type Etapa = typeof ETAPAS[number];

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  contato: string;
  observacoes: string;
  criado_em: string;
}

export interface Usuario {
  id: string;
  login: string;
  senha: string;
  nome: string;
  perfil: Perfil;
  ativo: boolean;
  criado_em: string;
}

export type AcaoAuditoria =
  | 'Criou pedido'
  | 'Importou pedidos'
  | 'Editou pedido'
  | 'Removeu pedido'
  | 'Mudou status'
  | 'Criou usuário'
  | 'Editou usuário'
  | 'Removeu usuário'
  | 'Criou cliente'
  | 'Editou cliente'
  | 'Removeu cliente'
  | 'Mudou etapa'
  | 'Login';

export interface AuditEntry {
  id: string;
  ts: string;
  usuario: string;
  nome_usuario: string;
  acao: AcaoAuditoria;
  entidade_label: string;
  detalhes?: string;
  /** Vincula o evento a um pedido (timeline) */
  pedido_id?: string;
}

export interface Pedido {
  id: string;
  num: string;
  data: string;
  cliente: string;
  nomePedidoOriginal: string;
  cor: string;
  qtd: number;
  numeroSistema: string;
  tecnica: string;
  status_producao: StatusProducao;
  status_pgto: StatusPagamento;
  entrega: string;
  observacoes: string;
  /** Etapa interna de produção ('' = não definida) */
  etapa?: string;
}

export interface PedidoEnriquecido extends Pedido {
  nome: string;
  dias: string;
  mes: string;
}

export interface Filtro {
  busca: string;
  status: string;
  pgto: string;
  mes: string;
}

export interface ModalState {
  mode: 'novo' | 'editar';
  pedido?: Pedido;
}

export interface ToastState {
  message: string;
  isError: boolean;
}
