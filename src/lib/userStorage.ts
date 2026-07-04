import { Usuario, Perfil } from '../types';
import { uid } from './helpers';
import { supabase } from './supabase';

const KEY = 'wishbone_users_v1';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IUserStorage {
  getAll(): Promise<Usuario[]>;
  add(u: Omit<Usuario, 'id' | 'criado_em'>): Promise<Usuario>;
  update(u: Usuario): Promise<void>;
  remove(id: string): Promise<void>;
  findByLogin(login: string): Promise<Usuario | undefined>;
}

// ─── localStorage implementation (dev/offline) ────────────────────────────────
const DEFAULTS: Omit<Usuario, 'id' | 'criado_em'>[] = [
  { login: 'admin',    senha: 'admin123', nome: 'Gerência Solar',      perfil: 'admin',    ativo: true },
  { login: 'producao', senha: 'prod123',  nome: 'Equipe de Produção',  perfil: 'producao', ativo: true },
];

function init(): Usuario[] {
  const data: Usuario[] = DEFAULTS.map(d => ({
    ...d,
    id: uid(),
    criado_em: new Date().toISOString(),
  }));
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

function load(): Usuario[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return init();
    const parsed = JSON.parse(raw) as Usuario[];
    return parsed.length > 0 ? parsed : init();
  } catch {
    return init();
  }
}

function save(data: Usuario[]): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

class LocalUserStorage implements IUserStorage {
  async getAll(): Promise<Usuario[]> {
    return load();
  }

  async add(u: Omit<Usuario, 'id' | 'criado_em'>): Promise<Usuario> {
    const all = load();
    const novo: Usuario = { ...u, id: uid(), criado_em: new Date().toISOString() };
    save([...all, novo]);
    return novo;
  }

  async update(u: Usuario): Promise<void> {
    const all = load();
    save(all.map(x => (x.id === u.id ? u : x)));
  }

  async remove(id: string): Promise<void> {
    const all = load();
    save(all.filter(x => x.id !== id));
  }

  async findByLogin(login: string): Promise<Usuario | undefined> {
    return load().find(u => u.login.toLowerCase() === login.toLowerCase());
  }
}

// ─── Supabase implementation ──────────────────────────────────────────────────
class SupabaseUserStorage implements IUserStorage {
  async getAll(): Promise<Usuario[]> {
    const { data, error } = await supabase!
      .from('usuarios')
      .select('*')
      .order('criado_em', { ascending: true });
    if (error) throw new Error(`Erro ao carregar usuários: ${error.message}`);
    return (data ?? []) as Usuario[];
  }

  async add(u: Omit<Usuario, 'id' | 'criado_em'>): Promise<Usuario> {
    const novo = { ...u, id: uid(), criado_em: new Date().toISOString() };
    const { error } = await supabase!.from('usuarios').insert(novo);
    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);
    return novo;
  }

  async update(u: Usuario): Promise<void> {
    const { id, ...rest } = u;
    const { error } = await supabase!.from('usuarios').update(rest).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase!.from('usuarios').delete().eq('id', id);
    if (error) throw new Error(`Erro ao remover usuário: ${error.message}`);
  }

  async findByLogin(login: string): Promise<Usuario | undefined> {
    const { data, error } = await supabase!
      .from('usuarios')
      .select('*')
      .ilike('login', login)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar usuário: ${error.message}`);
    return (data as Usuario) ?? undefined;
  }
}

export const userStorage: IUserStorage = supabase
  ? new SupabaseUserStorage()
  : new LocalUserStorage();

export type { Perfil };
