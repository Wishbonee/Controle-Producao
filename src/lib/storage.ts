import { Pedido, StatusProducao } from '../types';
import { SEED } from './seed';
import { supabase } from './supabase';

const DB_KEY = 'wishbone_pedidos_v2';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IStorage {
  getAll(): Promise<Pedido[]>;
  add(p: Pedido): Promise<void>;
  addMany(ps: Pedido[]): Promise<void>;
  update(p: Pedido): Promise<void>;
  remove(id: string): Promise<void>;
  setStatus(id: string, status: StatusProducao): Promise<void>;
}

// ─── localStorage implementation ──────────────────────────────────────────────
class LocalStorage implements IStorage {
  private save(data: Pedido[]): void {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  private seed(): Pedido[] {
    const data = JSON.parse(JSON.stringify(SEED)) as Pedido[];
    this.save(data);
    return data;
  }

  async getAll(): Promise<Pedido[]> {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? (JSON.parse(raw) as Pedido[]) : this.seed();
    } catch {
      return this.seed();
    }
  }

  async add(p: Pedido): Promise<void> {
    const all = await this.getAll();
    this.save([...all, p]);
  }

  async addMany(ps: Pedido[]): Promise<void> {
    const all = await this.getAll();
    this.save([...all, ...ps]);
  }

  async update(p: Pedido): Promise<void> {
    const all = await this.getAll();
    this.save(all.map(x => (x.id === p.id ? { ...x, ...p } : x)));
  }

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    this.save(all.filter(x => x.id !== id));
  }

  async setStatus(id: string, status: StatusProducao): Promise<void> {
    const all = await this.getAll();
    this.save(all.map(x => (x.id === id ? { ...x, status_producao: status } : x)));
  }
}

// ─── Supabase implementation ──────────────────────────────────────────────────
class SupabaseStorage implements IStorage {
  async getAll(): Promise<Pedido[]> {
    const { data, error } = await supabase!
      .from('pedidos')
      .select('id, num, data, cliente, nomePedidoOriginal, cor, qtd, numeroSistema, tecnica, status_producao, status_pgto, entrega, observacoes, etapa')
      .order('num', { ascending: true });
    if (error) throw new Error(`Erro ao carregar pedidos: ${error.message}`);
    return (data ?? []) as Pedido[];
  }

  async add(p: Pedido): Promise<void> {
    const { error } = await supabase!.from('pedidos').insert(p);
    if (error) throw new Error(`Erro ao criar pedido: ${error.message}`);
  }

  async addMany(ps: Pedido[]): Promise<void> {
    // Insere em blocos de 500 para não estourar o limite da API
    for (let i = 0; i < ps.length; i += 500) {
      const chunk = ps.slice(i, i + 500);
      const { error } = await supabase!.from('pedidos').insert(chunk);
      if (error) throw new Error(`Erro ao importar pedidos (bloco ${i / 500 + 1}): ${error.message}`);
    }
  }

  async update(p: Pedido): Promise<void> {
    const { id, ...rest } = p;
    const { error } = await supabase!.from('pedidos').update(rest).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar pedido: ${error.message}`);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase!.from('pedidos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao remover pedido: ${error.message}`);
  }

  async setStatus(id: string, status: StatusProducao): Promise<void> {
    const { error } = await supabase!.from('pedidos').update({ status_producao: status }).eq('id', id);
    if (error) throw new Error(`Erro ao mudar status: ${error.message}`);
  }
}

// Usa Supabase quando configurado (.env); senão cai para localStorage (dev/offline)
export const storage: IStorage = supabase ? new SupabaseStorage() : new LocalStorage();
