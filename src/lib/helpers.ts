import { Pedido, PedidoEnriquecido, StatusProducao } from '../types';

export function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  const p = s.includes('/') ? s.split('/') : s.includes('-') ? s.split('-') : null;
  if (!p || p.length !== 3) return null;
  const d = s.includes('/')
    ? new Date(+p[2], +p[1] - 1, +p[0])
    : new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtDate(v: string | null | undefined): string {
  const d = toDate(v as string);
  if (!d) return String(v ?? '');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function toInputDate(s: string): string {
  const d = toDate(s);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function inputToFmt(v: string): string {
  return v ? fmtDate(new Date(v + 'T00:00:00').toISOString()) : '';
}

export function mesExtenso(v: string): string {
  const d = toDate(v);
  if (!d) return '';
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

export function calcDias(entrega: string, status: StatusProducao): { status: StatusProducao; dias: string } {
  const norm = status.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (norm === 'ENTREGUE' || norm === 'FINALIZADO') return { status: 'Entregue', dias: 'Finalizado' };
  const d = toDate(entrega);
  if (!d) return { status, dias: '' };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoje.getTime()) / 86400000);
  if (diff < 0) return { status: 'ATRASADO', dias: `${Math.abs(diff)} dias atraso` };
  if (diff === 0) return { status, dias: 'Vence hoje' };
  return { status, dias: `${diff} dias` };
}

export function enrich(p: Pedido): PedidoEnriquecido {
  const di = calcDias(p.entrega, p.status_producao);
  const nome = [p.cliente, p.nomePedidoOriginal].filter(Boolean).join(' — ');
  return { ...p, nome, status_producao: di.status, dias: di.dias, mes: mesExtenso(p.data || p.entrega) || 'Sem Data' };
}

export function stClass(s: StatusProducao): string {
  const map: Record<string, string> = {
    'Em Produção': 'st-em',
    'ATRASADO': 'st-atrasado',
    'Entregue': 'st-entregue',
    'Enviado': 'st-enviado',
    'Aguardando': 'st-aguardando',
    'Cancelado': 'st-cancelado',
  };
  return map[s] ?? 'st-em';
}

export function pgtoClass(p: string): string {
  const u = (p ?? '').toUpperCase();
  if (u === 'PAGO') return 'badge-green';
  if (u === 'PARCIAL') return 'badge-yellow';
  return 'badge-red';
}

export function kBorderClass(s: StatusProducao): string {
  const map: Record<string, string> = {
    'Em Produção': 'k-border-em',
    'ATRASADO': 'k-border-atrasado',
    'Entregue': 'k-border-entregue',
    'Enviado': 'k-border-enviado',
    'Aguardando': 'k-border-aguardando',
    'Cancelado': 'k-border-cancelado',
  };
  return map[s] ?? 'k-border-em';
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function isUrgent(p: PedidoEnriquecido): boolean {
  if (p.status_producao === 'Entregue' || p.status_producao === 'Cancelado') return false;
  if (p.status_producao === 'ATRASADO') return true;
  const d = toDate(p.entrega);
  if (!d) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoje.getTime()) / 86400000);
  return diff <= 3;
}
