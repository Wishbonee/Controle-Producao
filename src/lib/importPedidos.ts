import { Pedido, StatusProducao, StatusPagamento } from '../types';
import { fmtDate, toDate } from './helpers';

export interface LinhaInvalida {
  linha: number;
  motivo: string;
}

export interface ImportResult {
  validos: Omit<Pedido, 'id'>[];
  duplicados: number;
  invalidos: LinhaInvalida[];
  totalLinhas: number;
}

/** Normaliza texto para comparação: maiúsculas, sem acentos/pontuação */
function normKey(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Campo = 'data' | 'num' | 'qtd' | 'cliente' | 'nome' | 'cor'
  | 'numeroSistema' | 'tecnica' | 'status' | 'pgto' | 'entrega' | 'obs';

/** Cabeçalhos aceitos (já normalizados) → campo interno */
const HEADER_MAP: Record<string, Campo> = {
  'DATA': 'data',
  'N PEDIDO': 'num', 'NO PEDIDO': 'num', 'NUM PEDIDO': 'num', 'PEDIDO': 'num', 'N': 'num',
  'QUANT': 'qtd', 'QTD': 'qtd', 'QUANTIDADE': 'qtd',
  'CLIENTE': 'cliente',
  'NOME DO PEDIDO': 'nome', 'NOME PEDIDO': 'nome', 'NOME': 'nome', 'PRODUTO': 'nome',
  'COR': 'cor',
  'N SISTEMA': 'numeroSistema', 'NO SISTEMA': 'numeroSistema', 'NUM SISTEMA': 'numeroSistema', 'SISTEMA': 'numeroSistema',
  'LOGOMARCA': 'tecnica', 'TECNICA': 'tecnica',
  'STATUS': 'status',
  'PGTO': 'pgto', 'PAGAMENTO': 'pgto', 'STATUS PGTO': 'pgto',
  'ENTREGA': 'entrega', 'DATA ENTREGA': 'entrega',
  'OBSERVACOES': 'obs', 'OBSERVACAO': 'obs', 'OBS': 'obs',
};

function normStatus(s: string): StatusProducao {
  const k = normKey(s);
  if (k.startsWith('ENTREG') || k.startsWith('FINALIZ')) return 'Entregue';
  if (k.startsWith('ATRAS')) return 'ATRASADO';
  if (k.startsWith('AGUARD')) return 'Aguardando';
  if (k.startsWith('ENVIAD')) return 'Enviado';
  if (k.startsWith('CANCEL')) return 'Cancelado';
  return 'Em Produção';
}

function normPgto(s: string): StatusPagamento {
  const k = normKey(s);
  if (k === 'PAGO') return 'PAGO';
  if (k.startsWith('PARC')) return 'PARCIAL';
  return 'PENDENTE';
}

/** Aceita dd/mm/aaaa, d/m/aaaa e aaaa-mm-dd; devolve dd/mm/aaaa ou '' */
function normData(s: string): string {
  const v = s.trim();
  if (!v) return '';
  return toDate(v) ? fmtDate(v) : '';
}

function normQtd(s: string): number {
  const n = parseInt(String(s).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Pedido mínimo para comparação de duplicados */
export interface PedidoExistente {
  num: string;
  data: string;
  cliente: string;
  nomePedidoOriginal: string;
  cor: string;
  qtd: number;
}

/** Chave de duplicidade: nº do pedido quando existe; senão, combinação dos campos */
function chaveDup(num: string, data: string, cliente: string, nome: string, cor: string, qtd: number): string {
  if (num) return `N:${num}`;
  return 'C:' + [data, cliente, nome, cor, qtd].map(v => normKey(String(v))).join('|');
}

/**
 * Lê uma planilha (.xlsx, .xls ou .csv) no modelo Wishbone e devolve
 * pedidos prontos para inserir + relatório de problemas.
 */
export async function parsePlanilha(dados: ArrayBuffer | string, existentes: PedidoExistente[]): Promise<ImportResult> {
  // Import dinâmico: a lib de Excel (~400 kB) só carrega quando alguém importa
  const XLSX = await import('xlsx');
  // string = CSV lido como texto (preserva acentos UTF-8); ArrayBuffer = .xlsx/.xls
  const wb = typeof dados === 'string'
    ? XLSX.read(dados, { type: 'string' })
    : XLSX.read(dados, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: false, defval: '' });

  const validos: Omit<Pedido, 'id'>[] = [];
  const invalidos: LinhaInvalida[] = [];
  let duplicados = 0;

  const chavesVistas = new Set(
    existentes.map(p => chaveDup(p.num, p.data, p.cliente, p.nomePedidoOriginal, p.cor, p.qtd))
  );

  linhas.forEach((raw, i) => {
    // nº da linha na planilha (1 = cabeçalho)
    const linha = i + 2;

    // Mapeia colunas pelo cabeçalho normalizado
    const row: Partial<Record<Campo, string>> = {};
    for (const [header, value] of Object.entries(raw)) {
      const campo = HEADER_MAP[normKey(header)];
      if (campo && row[campo] === undefined) row[campo] = String(value ?? '').trim();
    }

    // Linha totalmente vazia → ignora em silêncio
    if (Object.values(row).every(v => !v)) return;

    // Nº do pedido é opcional; normaliza espaços ("2138 - 2026" → "2138-2026")
    const num = (row.num ?? '').replace(/\s+/g, '');

    if (!row.cliente && !row.nome) {
      invalidos.push({ linha, motivo: `${num ? `#${num}: ` : ''}sem cliente e sem nome do pedido` });
      return;
    }

    const data = normData(row.data ?? '');
    const cliente = row.cliente ?? '';
    const nome = row.nome ?? '';
    const cor = row.cor ?? '';
    const qtd = normQtd(row.qtd ?? '');

    const chave = chaveDup(num, data, cliente, nome, cor, qtd);
    if (chavesVistas.has(chave)) {
      duplicados++;
      return;
    }
    chavesVistas.add(chave);

    validos.push({
      num,
      data,
      cliente,
      nomePedidoOriginal: nome,
      cor,
      qtd,
      numeroSistema: row.numeroSistema ?? '',
      tecnica: row.tecnica ?? '',
      status_producao: normStatus(row.status ?? ''),
      status_pgto: normPgto(row.pgto ?? ''),
      entrega: normData(row.entrega ?? ''),
      observacoes: row.obs ?? '',
    });
  });

  return { validos, duplicados, invalidos, totalLinhas: linhas.length };
}
