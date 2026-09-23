import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Pedido, PedidoEnriquecido, Perfil, ViewName, ModalState, ToastState, Usuario, Cliente } from '../types';
import { storage } from '../lib/storage';
import { userStorage } from '../lib/userStorage';
import { clienteStorage } from '../lib/clienteStorage';
import { auditStorage } from '../lib/auditStorage';
import { authenticate } from '../lib/auth';
import { enrich, uid, isUrgent } from '../lib/helpers';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface AppContextValue {
  // Auth
  usuario: string | null;
  perfil: Perfil | null;
  nome: string | null;
  isAdmin: boolean;
  /** Registro de quem está logado (foto, data de criação...) */
  meuUsuario: Usuario | null;
  alterarMinhaSenha(senha: string): Promise<void>;
  alterarMinhaFoto(url: string | null): Promise<void>;
  login(usuario: string, senha: string): Promise<boolean>;
  logout(): void;

  // Data
  pedidos: PedidoEnriquecido[];
  loading: boolean;
  refresh(): Promise<void>;
  addPedido(p: Omit<Pedido, 'id'>): Promise<void>;
  importPedidos(ps: Omit<Pedido, 'id'>[]): Promise<number>;
  updatePedido(p: Pedido): Promise<void>;
  removePedido(id: string): Promise<void>;
  setStatus(id: string, status: PedidoEnriquecido['status_producao']): Promise<void>;
  setEtapa(id: string, etapa: string): Promise<void>;

  // Detalhes do pedido (timeline/OP)
  detalheId: string | null;
  openDetalhe(id: string): void;
  closeDetalhe(): void;

  // Clientes
  clientes: Cliente[];
  addCliente(c: Omit<Cliente, 'id' | 'criado_em'>): Promise<void>;
  updateCliente(c: Cliente): Promise<void>;
  removeCliente(id: string): Promise<void>;

  // Derived
  urgentCount: number;

  // Navigation
  view: ViewName;
  navigate(v: ViewName): void;

  // Tema
  tema: Tema;
  setTema(t: Tema): void;

  // UI
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar(): void;
  closeMobileSidebar(): void;
  toast: ToastState | null;
  showToast(msg: string, isError?: boolean): void;
  modal: ModalState | null;
  openModal(mode: 'novo' | 'editar', pedido?: Pedido): void;
  closeModal(): void;

  // Confirm dialog
  confirmDialog: ConfirmDialogOptions | null;
  openConfirm(opts: ConfirmDialogOptions): void;
  closeConfirm(): void;

  // User management (admin only)
  usuarios: Usuario[];
  addUsuario(u: Omit<Usuario, 'id' | 'criado_em'>): Promise<void>;
  updateUsuario(u: Usuario): Promise<void>;
  removeUsuario(id: string): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

/* ─── Tema e menu recolhido ─────────────────────────────────────
   Mesmo contrato do Sistema de Orçamentos: três escolhas (claro,
   escuro, sistema), chave `wishbone:tema` no localStorage e a
   classe .dark no <html>. O index.html aplica a classe antes do
   React montar; aqui ela só é mantida em dia.
─────────────────────────────────────────────────────────────── */
export type Tema = 'claro' | 'escuro' | 'sistema';

const TEMA_KEY = 'wishbone:tema';
const MENU_KEY = 'wishbone:menu-recolhido';
const TEMAS: Tema[] = ['claro', 'escuro', 'sistema'];

/** Abaixo desta largura a lateral vira gaveta (igual ao `lg` do orçamento). */
export const DRAWER_BREAKPOINT = 1024;

function lerTema(): Tema {
  try {
    const salvo = localStorage.getItem(TEMA_KEY) as Tema | null;
    return salvo && TEMAS.includes(salvo) ? salvo : 'sistema';
  } catch {
    return 'sistema';
  }
}

function prefereEscuro(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function lerMenuRecolhido(): boolean {
  try {
    return localStorage.getItem(MENU_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [view, setView] = useState<ViewName>('dashboard');
  // Lido de forma síncrona: a tela já abre na largura certa, sem pular a cada F5
  const [sidebarCollapsed, setSidebarCollapsed] = useState(lerMenuRecolhido);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [tema, setTemaState] = useState<Tema>(lerTema);

  // A classe no <html> é o que liga o bloco .dark do index.css
  useEffect(() => {
    const escuro = tema === 'escuro' || (tema === 'sistema' && prefereEscuro());
    document.documentElement.classList.toggle('dark', escuro);
  }, [tema]);

  // Em "sistema", trocar o tema do SO com a aba aberta reflete na hora
  useEffect(() => {
    if (tema !== 'sistema') return;
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const aplicar = () => document.documentElement.classList.toggle('dark', query.matches);
    query.addEventListener('change', aplicar);
    return () => query.removeEventListener('change', aplicar);
  }, [tema]);

  const setTema = useCallback((t: Tema) => {
    if (!TEMAS.includes(t)) return;
    setTemaState(t);
    try {
      localStorage.setItem(TEMA_KEY, t);
    } catch {
      // sem armazenamento, vale só para esta aba
    }
  }, []);

  // Stable refs so CRUD callbacks don't re-create on every pedido/user change
  const usuarioRef = useRef(usuario);
  const nomeRef = useRef(nome);
  const pedidosRef = useRef(pedidos);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);
  useEffect(() => { nomeRef.current = nome; }, [nome]);
  useEffect(() => { pedidosRef.current = pedidos; }, [pedidos]);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const all = await storage.getAll();
      setPedidos(all.map(enrich));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar pedidos', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshUsuarios = useCallback(async () => {
    try {
      setUsuarios(await userStorage.getAll());
    } catch {
      // usuários carregam sob demanda na tela de Configurações
    }
  }, []);

  const refreshClientes = useCallback(async () => {
    try {
      setClientes(await clienteStorage.getAll());
    } catch {
      // clientes carregam sob demanda
    }
  }, []);

  useEffect(() => { refresh(); refreshUsuarios(); refreshClientes(); }, [refresh, refreshUsuarios, refreshClientes]);

  const login = useCallback(async (u: string, s: string): Promise<boolean> => {
    const record = await authenticate(u, s);
    if (!record) return false;
    setUsuario(u);
    setPerfil(record.perfil);
    setNome(record.nome);
    auditStorage.log({
      usuario: u,
      nome_usuario: record.nome,
      acao: 'Login',
      entidade_label: 'Acesso ao sistema',
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setPerfil(null);
    setNome(null);
    setView('dashboard');
  }, []);

  // ─── CRUD otimista: a UI atualiza na hora; se a rede falhar, reverte ───
  const addPedido = useCallback(async (p: Omit<Pedido, 'id'>) => {
    const id = uid();
    const novo: Pedido = { ...p, id };
    const snapshot = pedidosRef.current;
    setPedidos([...snapshot, enrich(novo)]);
    try {
      await storage.add(novo);
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Criou pedido',
        entidade_label: `#${p.num} — ${p.cliente} · ${p.nomePedidoOriginal}`,
        pedido_id: id,
      });
    } catch (err) {
      setPedidos(snapshot);
      showToast(err instanceof Error ? err.message : 'Erro ao criar pedido', true);
      throw err;
    }
  }, [showToast]);

  const importPedidos = useCallback(async (ps: Omit<Pedido, 'id'>[]): Promise<number> => {
    const novos: Pedido[] = ps.map(p => ({ ...p, id: crypto.randomUUID() }));
    try {
      await storage.addMany(novos);
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Importou pedidos',
        entidade_label: `Importação de planilha — ${novos.length} pedidos`,
      });
      await refresh();
      return novos.length;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao importar pedidos', true);
      throw err;
    }
  }, [refresh, showToast]);

  const updatePedido = useCallback(async (p: Pedido) => {
    const antes = pedidosRef.current.find(x => x.id === p.id);
    const snapshot = pedidosRef.current;
    setPedidos(snapshot.map(x => (x.id === p.id ? enrich(p) : x)));
    try {
      await storage.update(p);
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Editou pedido',
        entidade_label: `#${p.num} — ${p.cliente}`,
        detalhes: antes && antes.status_producao !== p.status_producao
          ? `Status: ${antes.status_producao} → ${p.status_producao}`
          : undefined,
        pedido_id: p.id,
      });
    } catch (err) {
      setPedidos(snapshot);
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar pedido', true);
      throw err;
    }
  }, [showToast]);

  const removePedido = useCallback(async (id: string) => {
    const pedido = pedidosRef.current.find(x => x.id === id);
    const snapshot = pedidosRef.current;
    setPedidos(snapshot.filter(x => x.id !== id));
    try {
      await storage.remove(id);
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Removeu pedido',
        entidade_label: pedido ? `#${pedido.num} — ${pedido.cliente}` : id,
        pedido_id: id,
      });
    } catch (err) {
      setPedidos(snapshot);
      showToast(err instanceof Error ? err.message : 'Erro ao remover pedido', true);
      throw err;
    }
  }, [showToast]);

  const setStatus = useCallback(async (id: string, status: PedidoEnriquecido['status_producao']) => {
    const antes = pedidosRef.current.find(x => x.id === id);
    const snapshot = pedidosRef.current;
    setPedidos(snapshot.map(x => (x.id === id ? enrich({ ...x, status_producao: status }) : x)));
    try {
      await storage.setStatus(id, status);
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Mudou status',
        entidade_label: antes ? `#${antes.num} — ${antes.cliente}` : id,
        detalhes: antes ? `${antes.status_producao} → ${status}` : undefined,
        pedido_id: id,
      });
    } catch (err) {
      setPedidos(snapshot);
      showToast(err instanceof Error ? err.message : 'Erro ao mudar status', true);
      throw err;
    }
  }, [showToast]);

  const setEtapa = useCallback(async (id: string, etapa: string) => {
    const antes = pedidosRef.current.find(x => x.id === id);
    if (!antes) return;
    const snapshot = pedidosRef.current;
    setPedidos(snapshot.map(x => (x.id === id ? { ...x, etapa } : x)));
    try {
      // remove campos derivados (não existem no banco)
      const { nome: _n, dias: _d, mes: _m, ...pedidoPuro } = antes;
      await storage.update({ ...pedidoPuro, etapa });
      auditStorage.log({
        usuario: usuarioRef.current ?? 'sistema',
        nome_usuario: nomeRef.current ?? 'Sistema',
        acao: 'Mudou etapa',
        entidade_label: `#${antes.num} — ${antes.cliente}`,
        detalhes: `${antes.etapa || 'Sem etapa'} → ${etapa || 'Sem etapa'}`,
        pedido_id: id,
      });
    } catch (err) {
      setPedidos(snapshot);
      showToast(err instanceof Error ? err.message : 'Erro ao mudar etapa', true);
      throw err;
    }
  }, [showToast]);

  const openDetalhe = useCallback((id: string) => setDetalheId(id), []);
  const closeDetalhe = useCallback(() => setDetalheId(null), []);

  const addCliente = useCallback(async (c: Omit<Cliente, 'id' | 'criado_em'>) => {
    await clienteStorage.add(c);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Criou cliente',
      entidade_label: c.nome,
    });
    await refreshClientes();
  }, [refreshClientes]);

  const updateCliente = useCallback(async (c: Cliente) => {
    await clienteStorage.update(c);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Editou cliente',
      entidade_label: c.nome,
    });
    await refreshClientes();
  }, [refreshClientes]);

  const removeCliente = useCallback(async (id: string) => {
    const c = clientes.find(x => x.id === id);
    await clienteStorage.remove(id);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Removeu cliente',
      entidade_label: c ? c.nome : id,
    });
    await refreshClientes();
  }, [clientes, refreshClientes]);

  const navigate = useCallback((v: ViewName) => setView(v), []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < DRAWER_BREAKPOINT) {
      setMobileSidebarOpen(o => !o);
    } else {
      setSidebarCollapsed(c => {
        try {
          localStorage.setItem(MENU_KEY, c ? '0' : '1');
        } catch {
          // sem armazenamento, vale só para esta aba
        }
        return !c;
      });
    }
  }, []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const openModal = useCallback((mode: 'novo' | 'editar', pedido?: Pedido) => {
    setModal({ mode, pedido });
  }, []);
  const closeModal = useCallback(() => setModal(null), []);

  const openConfirm = useCallback((opts: ConfirmDialogOptions) => setConfirmDialog(opts), []);
  const closeConfirm = useCallback(() => setConfirmDialog(null), []);

  const addUsuario = useCallback(async (u: Omit<Usuario, 'id' | 'criado_em'>) => {
    await userStorage.add(u);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Criou usuário',
      entidade_label: `${u.nome} (${u.login}) — perfil: ${u.perfil}`,
    });
    await refreshUsuarios();
  }, [refreshUsuarios]);

  const updateUsuario = useCallback(async (u: Usuario) => {
    await userStorage.update(u);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Editou usuário',
      entidade_label: `${u.nome} (${u.login})`,
    });
    await refreshUsuarios();
  }, [refreshUsuarios]);

  const removeUsuario = useCallback(async (id: string) => {
    const u = usuarios.find(x => x.id === id);
    await userStorage.remove(id);
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Removeu usuário',
      entidade_label: u ? `${u.nome} (${u.login})` : id,
    });
    await refreshUsuarios();
  }, [usuarios, refreshUsuarios]);

  /* ─── Conta de quem está logado (tela de Configurações) ───
     Não passa por updateUsuario: trocar a própria senha ou foto
     não é gestão de usuários e não pede perfil de admin. */
  const meuUsuario = usuario
    ? usuarios.find(u => u.login.toLowerCase() === usuario.toLowerCase()) ?? null
    : null;

  const alterarMinhaSenha = useCallback(async (senha: string) => {
    if (!meuUsuario) throw new Error('Usuário não encontrado');
    await userStorage.update({ ...meuUsuario, senha });
    auditStorage.log({
      usuario: usuarioRef.current ?? 'sistema',
      nome_usuario: nomeRef.current ?? 'Sistema',
      acao: 'Editou usuário',
      entidade_label: `${meuUsuario.nome} (${meuUsuario.login})`,
      detalhes: 'Alterou a própria senha',
    });
    await refreshUsuarios();
  }, [meuUsuario, refreshUsuarios]);

  const alterarMinhaFoto = useCallback(async (url: string | null) => {
    if (!meuUsuario) throw new Error('Usuário não encontrado');
    await userStorage.update({ ...meuUsuario, avatar_url: url });
    await refreshUsuarios();
  }, [meuUsuario, refreshUsuarios]);

  const urgentCount = pedidos.filter(isUrgent).length;

  const value: AppContextValue = {
    usuario, perfil, nome, isAdmin: perfil === 'admin',
    meuUsuario, alterarMinhaSenha, alterarMinhaFoto,
    login, logout,
    pedidos, loading, refresh, addPedido, importPedidos, updatePedido, removePedido, setStatus, setEtapa,
    detalheId, openDetalhe, closeDetalhe,
    clientes, addCliente, updateCliente, removeCliente,
    urgentCount,
    view, navigate,
    tema, setTema,
    sidebarCollapsed, mobileSidebarOpen, toggleSidebar, closeMobileSidebar,
    toast, showToast,
    modal, openModal, closeModal,
    confirmDialog, openConfirm, closeConfirm,
    usuarios, addUsuario, updateUsuario, removeUsuario,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
