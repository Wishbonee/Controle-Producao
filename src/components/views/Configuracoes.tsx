import { useState, useEffect, useRef } from 'react';
import { Users, History, UserPlus, Pencil, Trash2, ShieldCheck, HardHat, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Usuario, Perfil, AuditEntry } from '../../types';
import { auditStorage } from '../../lib/auditStorage';
import { Select, SelectOption } from '../ui/Select';

const PERFIL_OPTS: SelectOption[] = [
  { value: 'admin',    label: 'Admin',    dot: '#3b82f6' },
  { value: 'producao', label: 'Produção', dot: '#6b7280' },
];

const EMPTY_FORM = { login: '', nome: '', senha: '', perfil: 'producao' as Perfil, ativo: true };

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
  if (acao.startsWith('Criou'))   return '#4ade80';
  if (acao.startsWith('Editou'))  return '#60a5fa';
  if (acao.startsWith('Removeu')) return '#f87171';
  if (acao === 'Mudou status')    return '#fde047';
  if (acao === 'Login')           return '#a78bfa';
  return '#9ca3af';
}

/* ─── Sub-tab: Usuários ──────────────────────────────────────── */
function UsuariosTab() {
  const { usuario, usuarios, addUsuario, updateUsuario, removeUsuario, openConfirm, showToast } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [senhaVisible, setSenhaVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  function openNew() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setSenhaVisible(false);
    setShowForm(true);
    scrollToForm();
  }

  function openEdit(u: Usuario) {
    setEditUser(u);
    setForm({ login: u.login, nome: u.nome, senha: u.senha, perfil: u.perfil, ativo: u.ativo });
    setSenhaVisible(false);
    setShowForm(true);
    scrollToForm();
  }

  function cancelForm() {
    setShowForm(false);
    setEditUser(null);
  }

  async function handleSave() {
    if (!form.login.trim() || !form.nome.trim() || !form.senha.trim()) {
      showToast('Preencha todos os campos obrigatórios', true);
      return;
    }
    const loginConflict = usuarios.find(
      u => u.login.toLowerCase() === form.login.toLowerCase() && u.id !== editUser?.id
    );
    if (loginConflict) {
      showToast('Já existe um usuário com esse login', true);
      return;
    }
    try {
      if (editUser) {
        await updateUsuario({ ...editUser, ...form });
        showToast('Usuário atualizado');
      } else {
        await addUsuario(form);
        showToast('Usuário criado com sucesso');
      }
      setShowForm(false);
      setEditUser(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar usuário', true);
    }
  }

  function handleDelete(u: Usuario) {
    if (u.login.toLowerCase() === usuario?.toLowerCase()) {
      showToast('Você não pode remover seu próprio usuário', true);
      return;
    }
    openConfirm({
      title: `Remover ${u.nome}?`,
      message: 'Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema.',
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => { await removeUsuario(u.id); showToast('Usuário removido'); },
    });
  }

  async function toggleAtivo(u: Usuario) {
    if (u.login.toLowerCase() === usuario?.toLowerCase()) {
      showToast('Você não pode desativar seu próprio usuário', true);
      return;
    }
    await updateUsuario({ ...u, ativo: !u.ativo });
    showToast(u.ativo ? 'Usuário desativado' : 'Usuário ativado');
  }

  return (
    <div className="cfg-section">
      <div className="cfg-header">
        <div>
          <h3>Gerenciamento de Usuários</h3>
          <p className="cfg-sub">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-sm btn-primary" onClick={openNew}>
          <UserPlus size={14} />
          Novo Usuário
        </button>
      </div>

      {showForm && (
        <div ref={formRef} className={`cfg-form-card${editUser ? ' editing' : ' creating'}`}>
          <div className="cfg-form-title">
            <div className={`cfg-form-badge ${editUser ? 'badge-edit' : 'badge-new'}`}>
              {editUser ? <Pencil size={12} /> : <UserPlus size={12} />}
            </div>
            <h4>{editUser ? `Editando: ${editUser.nome}` : 'Novo Usuário'}</h4>
          </div>

          <div className="cfg-form-grid">
            <label className="form-label">
              Nome completo <span className="req">*</span>
              <input
                className="form-input"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: João Silva"
                autoFocus
              />
            </label>
            <label className="form-label">
              Login (usuário) <span className="req">*</span>
              <input
                className="form-input"
                value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                placeholder="Ex: joao.silva"
              />
            </label>
            <label className="form-label">
              Senha <span className="req">*</span>
              <div className="senha-wrap">
                <input
                  className="form-input"
                  type={senhaVisible ? 'text' : 'password'}
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="senha-toggle"
                  onClick={() => setSenhaVisible(v => !v)}
                  tabIndex={-1}
                  title={senhaVisible ? 'Ocultar senha' : 'Ver senha'}
                >
                  {senhaVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>
            <label className="form-label">
              Perfil de acesso
              <Select
                value={form.perfil}
                onChange={v => setForm(f => ({ ...f, perfil: v as Perfil }))}
                options={PERFIL_OPTS}
              />
            </label>
          </div>

          <div className="cfg-form-footer">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
              />
              Usuário ativo
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={cancelForm}>Cancelar</button>
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                {editUser ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cfg-table-wrap">
        <table className="cfg-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Criado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const isEditing = showForm && editUser?.id === u.id;
              return (
                <tr key={u.id} className={[
                  !u.ativo ? 'row-inactive' : '',
                  isEditing ? 'row-editing' : '',
                ].filter(Boolean).join(' ')}>
                  <td className="td-nome">
                    <span className="user-icon">
                      {u.perfil === 'admin' ? <ShieldCheck size={13} /> : <HardHat size={13} />}
                    </span>
                    {u.nome}
                    {u.login.toLowerCase() === usuario?.toLowerCase() && (
                      <span className="badge badge-yellow" style={{ marginLeft: 6, fontSize: 9 }}>você</span>
                    )}
                  </td>
                  <td><code className="login-code">{u.login}</code></td>
                  <td>
                    <span className={`badge ${u.perfil === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                      {u.perfil}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.ativo ? 'badge-green' : 'badge-red'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {fmtTs(u.criado_em).split(' ')[0]}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className={`btn btn-sm btn-icon${isEditing ? ' btn-editing' : ''}`}
                        onClick={() => isEditing ? cancelForm() : openEdit(u)}
                        title={isEditing ? 'Cancelar edição' : 'Editar'}
                      >
                        {isEditing ? <XCircle size={13} /> : <Pencil size={13} />}
                      </button>
                      <button
                        className={`btn btn-sm btn-icon ${u.ativo ? '' : 'btn-success'}`}
                        onClick={() => toggleAtivo(u)}
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {u.ativo ? <XCircle size={13} /> : <CheckCircle size={13} />}
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => handleDelete(u)}
                        title="Remover permanentemente"
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
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginado.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--muted)' }}>
                    {fmtTs(e.ts)}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 12 }}>{e.nome_usuario}</td>
                  <td><span className={acaoBadgeClass(e.acao)}>{e.acao}</span></td>
                  <td>
                    <div style={{ fontSize: 12 }}>{e.entidade_label}</div>
                    {e.detalhes && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{e.detalhes}</div>
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
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
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

/* ─── Configurações (root) ────────────────────────────────────── */
export function Configuracoes() {
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
