import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import {
  Users, History, UserPlus, Pencil, Trash2, KeyRound, UserX, UserCheck,
  RefreshCw, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Usuario, Perfil, AuditEntry } from '../../types';
import { auditStorage } from '../../lib/auditStorage';
import { Select, SelectOption } from '../ui/Select';
import { Avatar } from '../ui/Avatar';

/* ─── Contas da equipe — mesma tela /contas do orçamento ────────
   Admin cria, edita, gera senha nova, desativa e exclui.

   Duas regras que a tela garante:
   1. Ninguém mexe no próprio acesso (desativar, excluir, trocar
      o perfil). Seria o caminho mais curto para ficar trancado.
   2. O último admin ativo não sai de cena: sem ele ninguém mais
      gerencia contas.
─────────────────────────────────────────────────────────────── */

const PERFIL_OPTS: SelectOption[] = [
  { value: 'producao', label: 'Produção',      hint: 'pedidos, kanban e relatórios' },
  { value: 'admin',    label: 'Administrador', hint: 'também gerencia contas' },
];

const PERFIL_LABEL: Record<Perfil, string> = { admin: 'Administrador', producao: 'Produção' };

type Filtro = 'todas' | 'ativas' | 'inativas';
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas',    label: 'Todas' },
  { id: 'ativas',   label: 'Ativas' },
  { id: 'inativas', label: 'Inativas' },
];

// Uma função só decide o grupo: filtro e contagem nunca discordam
function passaNoFiltro(u: Usuario, filtro: Filtro): boolean {
  if (filtro === 'ativas') return u.ativo;
  if (filtro === 'inativas') return !u.ativo;
  return true;
}

type Coluna = 'nome' | 'ativo' | 'perfil' | 'ultimo' | 'criado_em';

/* Sem 0/O, 1/l/I: a senha vai ser ditada ou digitada de um papel */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function gerarSenha(tamanho = 10): string {
  const bytes = new Uint32Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALFABETO[b % ALFABETO.length]).join('');
}

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function acaoBadgeClass(acao: string): string {
  if (acao.startsWith('Criou'))   return 'audit-acao audit-acao-criou';
  if (acao.startsWith('Editou'))  return 'audit-acao audit-acao-editou';
  if (acao.startsWith('Removeu')) return 'audit-acao audit-acao-removeu';
  if (acao === 'Mudou status')    return 'audit-acao audit-acao-status';
  if (acao === 'Login')           return 'audit-acao audit-acao-login';
  return 'audit-acao';
}

function acaoDot(acao: string): string {
  if (acao.startsWith('Criou'))   return '#34d399';
  if (acao.startsWith('Editou'))  return '#60a5fa';
  if (acao.startsWith('Removeu')) return '#f87171';
  if (acao === 'Mudou status')    return '#f59e0b';
  if (acao === 'Login')           return '#a78bfa';
  return '#94a3b8';
}

/* ─── Formulário de criação e edição ──────────────────────────── */
interface ContaFormProps {
  conta: Usuario | null;
  ehVoce: boolean;
  salvando: boolean;
  onSalvar(dados: { nome: string; login: string; perfil: Perfil }): void;
  onCancelar(): void;
}

function ContaForm({ conta, ehVoce, salvando, onSalvar, onCancelar }: ContaFormProps) {
  const editando = Boolean(conta);
  const [nome, setNome] = useState(conta?.nome ?? '');
  const [login, setLogin] = useState(conta?.login ?? '');
  const [perfil, setPerfil] = useState<Perfil>(conta?.perfil ?? 'producao');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSalvar({ nome: nome.trim(), login: login.trim(), perfil });
  }

  return (
    <form onSubmit={handleSubmit} className="acc-form">
      <h2 className="acc-form-title">{editando ? `Editar ${conta!.nome}` : 'Nova conta'}</h2>

      <div className="acc-form-grid">
        <div className="field acc-span-2">
          <label htmlFor="conta-nome">Nome completo <span className="req">*</span></label>
          <input
            id="conta-nome"
            className="form-input"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex.: João Silva"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="conta-login">Login <span className="req">*</span></label>
          <input
            id="conta-login"
            className="form-input"
            value={login}
            readOnly={editando}
            onChange={e => setLogin(e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder="joao.silva"
          />
          {editando && <p className="st-hint">O login é a identidade da conta e não muda por aqui.</p>}
        </div>

        <div className="field">
          <label htmlFor="conta-perfil">Perfil</label>
          {ehVoce ? (
            <>
              <input id="conta-perfil" className="form-input" readOnly value={PERFIL_LABEL[perfil]} />
              <p className="st-hint">Você não altera o próprio perfil.</p>
            </>
          ) : (
            <Select value={perfil} onChange={v => setPerfil(v as Perfil)} options={PERFIL_OPTS} placeholder="" />
          )}
        </div>
      </div>

      <div className="btn-group acc-form-actions">
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar conta'}
        </button>
        <button type="button" className="btn" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

/* ─── Senha temporária: aparece uma vez ───────────────────────── */
function SenhaGerada({ conta, senha, onFechar }: { conta: string; senha: string; onFechar(): void }) {
  const { showToast } = useApp();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      showToast('Senha copiada');
    } catch {
      window.prompt('Copie a senha:', senha);
    }
  }

  return (
    <div className="acc-senha" role="status">
      <h2 className="acc-senha-title">Senha temporária de {conta}</h2>
      <p className="acc-senha-text">
        Ela não aparece de novo nesta tela. Copie agora e entregue; a pessoa
        pode trocá-la depois em Configurações → Senha.
      </p>
      <div className="acc-senha-row">
        <code className="acc-senha-code">{senha}</code>
        <button type="button" className="btn btn-sm btn-contrast" onClick={copiar}>Copiar</button>
        <button type="button" className="btn btn-sm acc-senha-ok" onClick={onFechar}>Já anotei</button>
      </div>
    </div>
  );
}

/* ─── Sub-tab: Usuários ──────────────────────────────────────── */
function UsuariosTab() {
  const { usuario, usuarios, addUsuario, updateUsuario, removeUsuario, openConfirm, showToast } = useApp();

  const [form, setForm] = useState<{ conta: Usuario | null } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [senha, setSenha] = useState<{ conta: string; valor: string } | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [sort, setSort] = useState<{ col: Coluna; dir: 'asc' | 'desc' }>({ col: 'nome', dir: 'asc' });
  const [ultimoAcesso, setUltimoAcesso] = useState<Record<string, string>>({});
  const topoRef = useRef<HTMLDivElement>(null);

  // "Último acesso" sai do log de auditoria (evento Login)
  useEffect(() => {
    auditStorage.getAll().then(entries => {
      const mapa: Record<string, string> = {};
      for (const e of entries) {
        if (e.acao !== 'Login') continue;
        const k = e.usuario.toLowerCase();
        if (!mapa[k] || e.ts > mapa[k]) mapa[k] = e.ts;
      }
      setUltimoAcesso(mapa);
    }).catch(() => setUltimoAcesso({}));
  }, []);

  const ehVoce = (u: Usuario) => u.login.toLowerCase() === usuario?.toLowerCase();
  const adminsAtivos = usuarios.filter(u => u.perfil === 'admin' && u.ativo).length;
  const ultimoAdmin = (u: Usuario) => u.perfil === 'admin' && u.ativo && adminsAtivos <= 1;
  const ultimo = (u: Usuario) => ultimoAcesso[u.login.toLowerCase()] ?? '';

  const ordenadas = useMemo(() => {
    const copia = usuarios.filter(u => passaNoFiltro(u, filtro));
    const valor = (u: Usuario): string | number => {
      switch (sort.col) {
        case 'ativo':  return Number(u.ativo);
        case 'ultimo': return ultimoAcesso[u.login.toLowerCase()] ?? '';
        default:       return u[sort.col];
      }
    };
    copia.sort((a, b) => {
      const x = valor(a), y = valor(b);
      const cmp = typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), 'pt-BR');
      return sort.dir === 'desc' ? -cmp : cmp;
    });
    return copia;
  }, [usuarios, filtro, sort, ultimoAcesso]);

  function ordenar(col: Coluna) {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  function abrirForm(conta: Usuario | null) {
    setForm({ conta });
    setTimeout(() => topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  async function salvar(dados: { nome: string; login: string; perfil: Perfil }) {
    if (!dados.nome || !dados.login) {
      showToast('Preencha nome e login', true);
      return;
    }
    const conflito = usuarios.find(
      u => u.login.toLowerCase() === dados.login.toLowerCase() && u.id !== form?.conta?.id
    );
    if (conflito) {
      showToast('Já existe uma conta com esse login', true);
      return;
    }
    const conta = form?.conta;
    if (conta && conta.perfil === 'admin' && dados.perfil !== 'admin' && ultimoAdmin(conta)) {
      showToast('Esta é a última conta de administrador ativa', true);
      return;
    }

    setSalvando(true);
    try {
      if (conta) {
        await updateUsuario({ ...conta, nome: dados.nome, perfil: dados.perfil });
        showToast(`Conta atualizada — ${dados.nome}`);
      } else {
        const nova = gerarSenha();
        await addUsuario({ ...dados, senha: nova, ativo: true });
        setSenha({ conta: dados.nome, valor: nova });
        showToast(`Conta criada — ${dados.nome}`);
      }
      setForm(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível salvar', true);
    } finally {
      setSalvando(false);
    }
  }

  async function aplicarAtivo(u: Usuario) {
    try {
      await updateUsuario({ ...u, ativo: !u.ativo });
      showToast(`${u.ativo ? 'Conta desativada' : 'Conta reativada'} — ${u.nome}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível alterar', true);
    }
  }

  function alternarAtivo(u: Usuario) {
    // Reativar não pergunta: não tira nada de ninguém
    if (!u.ativo) { aplicarAtivo(u); return; }
    openConfirm({
      title: `Desativar ${u.nome}?`,
      message: 'A pessoa perde o acesso no próximo login. O nome dela continua na auditoria e dá para reativar depois.',
      confirmLabel: 'Desativar',
      danger: true,
      onConfirm: () => aplicarAtivo(u),
    });
  }

  function novaSenha(u: Usuario) {
    openConfirm({
      title: `Gerar nova senha para ${u.nome}?`,
      message: 'A senha atual para de funcionar na hora. A nova aparece uma única vez, para você repassar.',
      confirmLabel: 'Gerar senha',
      onConfirm: async () => {
        try {
          const gerada = gerarSenha();
          await updateUsuario({ ...u, senha: gerada });
          setSenha({ conta: u.nome, valor: gerada });
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Não foi possível redefinir', true);
        }
      },
    });
  }

  function excluir(u: Usuario) {
    openConfirm({
      title: `Excluir a conta de ${u.nome}?`,
      message: 'O acesso é apagado e isso não tem volta. Para só tirar o acesso, desative em vez de excluir.',
      confirmLabel: 'Excluir conta',
      danger: true,
      onConfirm: async () => {
        try {
          await removeUsuario(u.id);
          showToast(`Conta excluída — ${u.nome}`);
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Não foi possível excluir', true);
        }
      },
    });
  }

  const ativas = usuarios.filter(u => u.ativo).length;
  const contagem = Object.fromEntries(
    FILTROS.map(op => [op.id, usuarios.filter(u => passaNoFiltro(u, op.id)).length])
  ) as Record<Filtro, number>;

  function Th({ col, label }: { col: Coluna; label: string }) {
    const ativo = sort.col === col;
    return (
      <th aria-sort={ativo ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button type="button" className={`th-sort${ativo ? ' active' : ''}`} onClick={() => ordenar(col)}>
          {label}
          {ativo && (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </th>
    );
  }

  return (
    <div className="cfg-section" ref={topoRef}>
      {senha && <SenhaGerada conta={senha.conta} senha={senha.valor} onFechar={() => setSenha(null)} />}

      {form && (
        <ContaForm
          key={form.conta?.id ?? 'nova'}
          conta={form.conta}
          ehVoce={!!form.conta && ehVoce(form.conta)}
          salvando={salvando}
          onSalvar={salvar}
          onCancelar={() => setForm(null)}
        />
      )}

      <div className="acc-card">
        <div className="acc-card-head">
          <div>
            <div className="acc-card-title">
              <h3>Equipe</h3>
              <span className="badge badge-gray">{ativas} ativa{ativas !== 1 ? 's' : ''} de {usuarios.length}</span>
            </div>
            <p className="cfg-sub">Clique no cabeçalho para ordenar.</p>
          </div>

          <div className="acc-card-tools">
            <div className="seg" role="group" aria-label="Filtrar por situação">
              {FILTROS.map(op => (
                <button
                  key={op.id}
                  type="button"
                  aria-pressed={filtro === op.id}
                  className={`seg-btn${filtro === op.id ? ' active' : ''}`}
                  onClick={() => setFiltro(op.id)}
                >
                  {op.label}
                  <span className="seg-count">{contagem[op.id]}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => abrirForm(null)}>
              <UserPlus size={14} />
              Nova conta
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="cfg-table acc-table">
            <thead>
              <tr>
                <Th col="nome" label="Nome" />
                <Th col="ativo" label="Situação" />
                <Th col="perfil" label="Perfil" />
                <Th col="ultimo" label="Último acesso" />
                <Th col="criado_em" label="Criada em" />
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {ordenadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td-empty">
                    {filtro === 'todas'
                      ? 'Nenhuma conta cadastrada.'
                      : `Nenhuma conta ${filtro === 'ativas' ? 'ativa' : 'inativa'}.`}
                  </td>
                </tr>
              ) : ordenadas.map(u => {
                const voce = ehVoce(u);
                const protegido = voce || ultimoAdmin(u);
                const motivo = voce ? 'Não vale para a sua própria conta' : 'Última conta de administrador ativa';
                const editando = form?.conta?.id === u.id;
                const acesso = ultimo(u);
                return (
                  <tr key={u.id} className={editando ? 'row-editing' : undefined}>
                    <td>
                      <div className="acc-user">
                        <Avatar name={u.nome} url={u.avatar_url} size={36} />
                        <div style={{ minWidth: 0 }}>
                          <p className="acc-user-name">
                            {u.nome}
                            {voce && <span className="acc-you">você</span>}
                          </p>
                          <p className="acc-user-login">{u.login}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-dot ${u.ativo ? 'badge-green' : 'badge-gray'}`}>
                        {u.ativo ? 'Ativa' : 'Desativada'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.perfil === 'admin' ? 'badge-brand' : 'badge-gray'}`}>
                        {PERFIL_LABEL[u.perfil]}
                      </span>
                    </td>
                    <td className="td-date">{acesso ? fmtTs(acesso) : 'Nunca entrou'}</td>
                    <td className="td-date">{fmtTs(u.criado_em).split(' ')[0]}</td>
                    <td>
                      <div className="row-actions acc-actions">
                        <button
                          className={`btn btn-sm btn-icon${editando ? ' btn-editing' : ''}`}
                          onClick={() => (editando ? setForm(null) : abrirForm(u))}
                          title={editando ? 'Cancelar edição' : 'Editar'}
                          aria-label={editando ? 'Cancelar edição' : `Editar ${u.nome}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn btn-sm btn-icon"
                          onClick={() => novaSenha(u)}
                          title="Gerar nova senha"
                          aria-label={`Gerar nova senha para ${u.nome}`}
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          className={`btn btn-sm btn-icon${u.ativo ? '' : ' btn-success'}`}
                          onClick={() => alternarAtivo(u)}
                          disabled={u.ativo && protegido}
                          title={u.ativo && protegido ? motivo : u.ativo ? 'Desativar' : 'Reativar'}
                          aria-label={`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}`}
                        >
                          {u.ativo ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-icon-danger"
                          onClick={() => excluir(u)}
                          disabled={protegido}
                          title={protegido ? motivo : 'Excluir'}
                          aria-label={`Excluir ${u.nome}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-tab: Auditoria ─────────────────────────────────────── */
function AuditoriaTab() {
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [pagina, setPagina] = useState(0);

  const POR_PAGINA = 50;

  async function carregar() {
    try {
      setAudit(await auditStorage.getAll());
    } catch {
      setAudit([]);
    }
  }

  useEffect(() => { carregar(); }, []);

  const usuariosUnicos = [...new Set(audit.map(e => e.nome_usuario))];
  const acoesUnicas    = [...new Set(audit.map(e => e.acao))];

  const usuarioOpts: SelectOption[] = usuariosUnicos.map(u => ({ value: u, label: u }));
  const acaoOpts: SelectOption[]    = acoesUnicas.map(a => ({ value: a, label: a, dot: acaoDot(a) }));

  const filtrado = audit.filter(e =>
    (!filtroUsuario || e.nome_usuario === filtroUsuario) &&
    (!filtroAcao    || e.acao        === filtroAcao)
  );

  const totalPaginas = Math.ceil(filtrado.length / POR_PAGINA);
  const paginado = filtrado.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  function mudarFiltro(campo: 'usuario' | 'acao', valor: string) {
    if (campo === 'usuario') setFiltroUsuario(valor);
    else setFiltroAcao(valor);
    setPagina(0);
  }

  return (
    <div className="cfg-section">
      <div className="cfg-header">
        <div>
          <h3>Log de Auditoria</h3>
          <p className="cfg-sub">{filtrado.length} de {audit.length} registros</p>
        </div>
        <button className="btn btn-sm" onClick={carregar} title="Atualizar">
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      <div className="cfg-filters">
        <Select
          value={filtroUsuario}
          onChange={v => mudarFiltro('usuario', v)}
          options={usuarioOpts}
          placeholder="Todos os usuários"
          className="cfg-select"
        />
        <Select
          value={filtroAcao}
          onChange={v => mudarFiltro('acao', v)}
          options={acaoOpts}
          placeholder="Todas as ações"
          className="cfg-select"
        />
      </div>

      <div className="cfg-table-wrap">
        <table className="cfg-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Data / Hora</th>
              <th style={{ width: 140 }}>Usuário</th>
              <th style={{ width: 130 }}>Ação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {paginado.length === 0 ? (
              <tr>
                <td colSpan={4} className="td-empty">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginado.map(e => (
                <tr key={e.id}>
                  <td className="td-date">
                    {fmtTs(e.ts)}
                  </td>
                  <td className="td-strong">{e.nome_usuario}</td>
                  <td><span className={acaoBadgeClass(e.acao)}>{e.acao}</span></td>
                  <td>
                    <div>{e.entidade_label}</div>
                    {e.detalhes && (
                      <div className="td-sub">{e.detalhes}</div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="cfg-pagination">
          <button
            className="btn btn-sm"
            disabled={pagina === 0}
            onClick={() => setPagina(p => p - 1)}
          >
            ← Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            className="btn btn-sm"
            disabled={pagina >= totalPaginas - 1}
            onClick={() => setPagina(p => p + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Contas (root) — igual à tela /contas do orçamento ───────── */
export function Contas() {
  const { isAdmin } = useApp();
  const [tab, setTab] = useState<'usuarios' | 'auditoria'>('usuarios');

  if (!isAdmin) {
    return (
      <div className="empty-msg" style={{ padding: '60px 0' }}>
        Acesso restrito a administradores.
      </div>
    );
  }

  return (
    <>
      <div className="cfg-tabs">
        <button
          className={`cfg-tab${tab === 'usuarios' ? ' active' : ''}`}
          onClick={() => setTab('usuarios')}
        >
          <Users size={14} />
          Usuários
        </button>
        <button
          className={`cfg-tab${tab === 'auditoria' ? ' active' : ''}`}
          onClick={() => setTab('auditoria')}
        >
          <History size={14} />
          Auditoria
        </button>
      </div>

      {tab === 'usuarios' ? <UsuariosTab /> : <AuditoriaTab />}
    </>
  );
}
