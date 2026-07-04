import { Cliente } from '../types';
import { uid } from './helpers';
import { supabase } from './supabase';

const KEY = 'wishbone_clientes_v1';

export interface IClienteStorage {
  getAll(): Promise<Cliente[]>;
  add(c: Omit<Cliente, 'id' | 'criado_em'>): Promise<Cliente>;
  update(c: Cliente): Promise<void>;
  remove(id: string): Promise<void>;
}

// ─── localStorage (dev/offline) ───────────────────────────────────────────────
function load(): Cliente[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Cliente[]) : [];
  } catch {
    return [];
  }
}

function save(data: Cliente[]): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

class LocalClienteStorage implements IClienteStorage {
  async getAll(): Promise<Cliente[]> {
    return load().sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async add(c: Omit<Cliente, 'id' | 'criado_em'>): Promise<Cliente> {
    const novo: Cliente = { ...c, id: uid(), criado_em: new Date().toISOString() };
    save([...load(), novo]);
    return novo;
  }

  async update(c: Cliente): Promise<void> {
    save(load().map(x => (x.id === c.id ? c : x)));
  }

  async remove(id: string): Promise<void> {
    save(load().filter(x => x.id !== id));
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
class SupabaseClienteStorage implements IClienteStorage {
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase!
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw new Error(`Erro ao carregar clientes: ${error.message}`);
    return (data ?? []) as Cliente[];
  }

  async add(c: Omit<Cliente, 'id' | 'criado_em'>): Promise<Cliente> {
    const novo = { ...c, id: uid(), criado_em: new Date().toISOString() };
    const { error } = await supabase!.from('clientes').insert(novo);
    if (error) throw new Error(`Erro ao criar cliente: ${error.message}`);
    return novo;
  }

  async update(c: Cliente): Promise<void> {
    const { id, ...rest } = c;
    const { error } = await supabase!.from('clientes').update(rest).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar cliente: ${error.message}`);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase!.from('clientes').delete().eq('id', id);
    if (error) throw new Error(`Erro ao remover cliente: ${error.message}`);
  }
}

export const clienteStorage: IClienteStorage = supabase
  ? new SupabaseClienteStorage()
  : new LocalClienteStorage();
