import { AuditEntry, AcaoAuditoria } from '../types';
import { uid } from './helpers';
import { supabase } from './supabase';

const KEY = 'wishbone_audit_v1';
const MAX = 1000;

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IAuditStorage {
  getAll(): Promise<AuditEntry[]>;
  /** Timeline de um pedido específico */
  getByPedido(pedidoId: string): Promise<AuditEntry[]>;
  /** Fire-and-forget: não bloqueia a ação principal se o log falhar */
  log(entry: Omit<AuditEntry, 'id' | 'ts'>): void;
}

// ─── localStorage implementation (dev/offline) ────────────────────────────────
function load(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function save(data: AuditEntry[]): void {
  const trimmed = data.length > MAX ? data.slice(data.length - MAX) : data;
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

class LocalAuditStorage implements IAuditStorage {
  async getAll(): Promise<AuditEntry[]> {
    return [...load()].reverse();
  }

  async getByPedido(pedidoId: string): Promise<AuditEntry[]> {
    return [...load()].reverse().filter(e => e.pedido_id === pedidoId);
  }

  log(entry: Omit<AuditEntry, 'id' | 'ts'>): void {
    const all = load();
    save([...all, { ...entry, id: uid(), ts: new Date().toISOString() }]);
  }
}

// ─── Supabase implementation ──────────────────────────────────────────────────
class SupabaseAuditStorage implements IAuditStorage {
  async getAll(): Promise<AuditEntry[]> {
    const { data, error } = await supabase!
      .from('auditoria')
      .select('*')
      .order('ts', { ascending: false })
      .limit(MAX);
    if (error) throw new Error(`Erro ao carregar auditoria: ${error.message}`);
    return (data ?? []) as AuditEntry[];
  }

  async getByPedido(pedidoId: string): Promise<AuditEntry[]> {
    const { data, error } = await supabase!
      .from('auditoria')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('ts', { ascending: false });
    if (error) throw new Error(`Erro ao carregar histórico: ${error.message}`);
    return (data ?? []) as AuditEntry[];
  }

  log(entry: Omit<AuditEntry, 'id' | 'ts'>): void {
    supabase!
      .from('auditoria')
      .insert({ ...entry, id: uid(), ts: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('Falha ao gravar auditoria:', error.message);
      });
  }
}

export const auditStorage: IAuditStorage = supabase
  ? new SupabaseAuditStorage()
  : new LocalAuditStorage();

export type { AcaoAuditoria };
