import { useState, useMemo, useRef } from 'react';
import { Search, UserPlus, Pencil, Trash2, XCircle, Building2, MessageCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Cliente } from '../../types';
import { EmptyState } from '../ui/EmptyState';

const EMPTY_FORM = { nome: '', whatsapp: '', contato: '', observacoes: '' };

function waLink(whatsapp: string): string {
  return `https://wa.me/55${whatsapp.replace(/\D/g, '')}`;
}

export function Clientes() {
  const { clientes, pedidos, addCliente, updateCliente, removeCliente, openConfirm, showToast } = useApp();

  const [busca, setBusca] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Estatísticas por cliente a partir dos pedidos
  const stats = useMemo(() => {
    const map: Record<string, { pedidos: number; bonos: number }> = {};
    pedidos.forEach(p => {
      const k = p.cliente.trim().toLowerCase();
      if (!k) return;
      if (!map[k]) map[k] = { pedidos: 0, bonos: 0 };
      map[k].pedidos++;
      map[k].bonos += p.qtd;
    });
    return map;
  }, [pedidos]);

  const filtrados = useMemo(() => {
    if (!busca) return clientes;
    const q = busca.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      c.contato.toLowerCase().includes(q) ||
      c.whatsapp.includes(q)
    );
  }, [clientes, busca]);

  function scrollToForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  function openNew() {
    setEditCliente(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    scrollToForm();
  }

  function openEdit(c: Cliente) {
    setEditCliente(c);
    setForm({ nome: c.nome, whatsapp: c.whatsapp, contato: c.contato, observacoes: c.observacoes });
    setShowForm(true);
    scrollToForm();
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      showToast('Informe o nome do cliente', true);
      return;
    }
    const conflito = clientes.find(
      c => c.nome.trim().toLowerCase() === form.nome.trim().toLowerCase() && c.id !== editCliente?.id
    );
    if (conflito) {
      showToast('Já existe um cliente com esse nome', true);
      return;
    }
    setSaving(true);
    try {
      if (editCliente) {
        await updateCliente({ ...editCliente, ...form, nome: form.nome.trim() });
        showToast('Cliente atualizado');
      } else {
        await addCliente({ ...form, nome: form.nome.trim() });
        showToast('Cliente cadastrado');
      }
      setShowForm(false);
      setEditCliente(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar cliente', true);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(c: Cliente) {
    openConfirm({
      title: `Remover ${c.nome}?`,
      message: 'Os pedidos existentes não serão apagados — apenas o cadastro do cliente.',
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => { await removeCliente(c.id); showToast('Cliente removido'); },
    });
  }

  return (
    <div className="cfg-section">
      <div className="cfg-header">
        <div>
          <h3>Clientes</h3>
          <p className="cfg-sub">{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-sm btn-primary" onClick={openNew}>
          <UserPlus size={14} />
          Novo Cliente
        </button>
      </div>

      <div className="controls-bar" style={{ marginBottom: 0 }}>
        <div className="filter-group fg-search">
          <label>Buscar</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              style={{ paddingLeft: 30, width: '100%' }}
              placeholder="Nome, contato ou WhatsApp..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div ref={formRef} className={`cfg-form-card${editCliente ? ' editing' : ' creating'}`}>
          <div className="cfg-form-title">
            <div className={`cfg-form-badge ${editCliente ? 'badge-edit' : 'badge-new'}`}>
              {editCliente ? <Pencil size={12} /> : <UserPlus size={12} />}
            </div>
            <h4>{editCliente ? `Editando: ${editCliente.nome}` : 'Novo Cliente'}</h4>
          </div>

          <div className="cfg-form-grid">
            <label className="form-label">
              Nome <span className="req">*</span>
              <input
                className="form-input"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: REV. GABRIEL"
                autoFocus
              />
            </label>
            <label className="form-label">
              WhatsApp
              <input
                className="form-input"
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="Ex: (83) 99999-9999"
              />
            </label>
            <label className="form-label">
              Pessoa de contato
              <input
                className="form-input"
                value={form.contato}
                onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
                placeholder="Ex: Gabriel"
              />
            </label>
            <label className="form-label">
              Observações
              <input
                className="form-input"
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Revendedor, condições especiais..."
              />
            </label>
          </div>

          <div className="cfg-form-footer" style={{ justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => { setShowForm(false); setEditCliente(null); }}>Cancelar</button>
              <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : editCliente ? 'Salvar alterações' : 'Cadastrar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={busca ? 'Tente outro termo de busca.' : 'Cadastre clientes para usar o autocomplete nos pedidos. Dica: a migração SQL importa os clientes dos pedidos existentes.'}
        />
      ) : (
        <div className="cfg-table-wrap">
          <table className="cfg-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Contato</th>
                <th>Pedidos</th>
                <th>Bonés</th>
                <th>Observações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => {
                const s = stats[c.nome.trim().toLowerCase()];
                const isEditing = showForm && editCliente?.id === c.id;
                return (
                  <tr key={c.id} className={isEditing ? 'row-editing' : ''}>
                    <td className="td-nome">
                      <span className="user-icon"><Building2 size={13} /></span>
                      {c.nome}
                    </td>
                    <td>
                      {c.whatsapp ? (
                        <a
                          className="wa-link"
                          href={waLink(c.whatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageCircle size={12} />
                          {c.whatsapp}
                        </a>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{c.contato || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td><strong>{s?.pedidos ?? 0}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>{(s?.bonos ?? 0).toLocaleString('pt-BR')}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.observacoes}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className={`btn btn-sm btn-icon${isEditing ? ' btn-editing' : ''}`}
                          onClick={() => isEditing ? (setShowForm(false), setEditCliente(null)) : openEdit(c)}
                          title={isEditing ? 'Cancelar edição' : 'Editar'}
                        >
                          {isEditing ? <XCircle size={13} /> : <Pencil size={13} />}
                        </button>
                        <button className="btn btn-sm btn-icon btn-danger" onClick={() => handleDelete(c)} title="Remover">
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
      )}
    </div>
  );
}
