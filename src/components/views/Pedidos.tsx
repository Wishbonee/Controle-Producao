import { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, CheckCircle, ClipboardList, Upload, Eye } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ImportModal } from '../ui/ImportModal';
import { Select, STATUS_PRODUCAO_OPTS, PGTO_OPTS_SELECT } from '../ui/Select';
import { useApp } from '../../contexts/AppContext';
import { PedidoEnriquecido, StatusProducao } from '../../types';
import { pgtoClass } from '../../lib/helpers';

function StatusCell({ p, onChange }: {
  p: PedidoEnriquecido;
  onChange: (s: StatusProducao) => void;
}) {
  return (
    <div style={{ minWidth: 140 }}>
      <Select
        value={p.status_producao}
        onChange={v => onChange(v as StatusProducao)}
        options={STATUS_PRODUCAO_OPTS}
        compact
      />
    </div>
  );
}

export function Pedidos() {
  const { pedidos, setStatus, removePedido, openModal, showToast, openConfirm, openDetalhe } = useApp();

  const [busca, setBusca] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPgto, setFilterPgto] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [showImport, setShowImport] = useState(false);

  const meses = useMemo(() => {
    const set = new Set(pedidos.map(p => p.mes).filter(Boolean));
    return Array.from(set);
  }, [pedidos]);

  const filtered = useMemo(() => {
    return pedidos.filter(p => {
      if (filterMes && p.mes !== filterMes) return false;
      if (filterStatus && p.status_producao !== filterStatus) return false;
      if (filterPgto && p.status_pgto !== filterPgto) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!p.nome.toLowerCase().includes(q) && !p.num.includes(q) && !p.tecnica.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [pedidos, busca, filterStatus, filterPgto, filterMes]);

  const byMes = useMemo(() => {
    const map = new Map<string, PedidoEnriquecido[]>();
    filtered.forEach(p => {
      const m = p.mes || 'Sem Data';
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(p);
    });
    return map;
  }, [filtered]);

  function handleDelete(id: string) {
    openConfirm({
      title: 'Remover este pedido?',
      message: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        await removePedido(id);
        showToast('Pedido removido.');
      },
    });
  }

  function handleEntregue(id: string) {
    openConfirm({
      title: 'Confirmar entrega?',
      message: 'O pedido será marcado como entregue.',
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        await setStatus(id, 'Entregue');
        showToast('Marcado como entregue!');
      },
    });
  }

  return (
    <>
      {/* Filtros */}
      <div className="controls-bar">
        <div className="filter-group fg-search">
          <label>Buscar</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              style={{ paddingLeft: 30 }}
              placeholder="Cliente, nº pedido, tipo de boné..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_PRODUCAO_OPTS}
            placeholder="Todos os status"
            compact
          />
        </div>
        <div className="filter-group">
          <label>Pagamento</label>
          <Select
            value={filterPgto}
            onChange={setFilterPgto}
            options={PGTO_OPTS_SELECT}
            placeholder="Todos"
            compact
          />
        </div>
        <div className="filter-group">
          <label>Mês</label>
          <Select
            value={filterMes}
            onChange={setFilterMes}
            options={meses.map(m => ({ value: m, label: m }))}
            placeholder="Todos os meses"
            compact
          />
        </div>
        <div className="filter-group filter-actions">
          <button className="btn btn-sm" onClick={() => { setBusca(''); setFilterStatus(''); setFilterPgto(''); setFilterMes(''); }}>
            Limpar
          </button>
          <button className="btn btn-sm" onClick={() => setShowImport(true)} title="Importar planilha de pedidos">
            <Upload size={13} />
            Importar
          </button>
        </div>
      </div>

      {/* Month tabs */}
      <div className="month-tabs">
        <button className={`tab${filterMes === '' ? ' tab-active' : ''}`} onClick={() => setFilterMes('')}>Todos ({pedidos.length})</button>
        {meses.map(m => (
          <button key={m} className={`tab${filterMes === m ? ' tab-active' : ''}`} onClick={() => setFilterMes(m)}>
            {m}
          </button>
        ))}
      </div>

      {/* Tables by month */}
      {filtered.length === 0
        ? <EmptyState icon={ClipboardList} title="Nenhum pedido encontrado" description="Tente ajustar os filtros ou crie um novo pedido." />
        : Array.from(byMes.entries()).map(([mes, items]) => (
          <div key={mes} className="table-card">
            <div className="month-header">
              <span>{mes}</span>
              <span className="month-count">{items.length} {items.length === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
            <div className="table-scroll">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Cliente / Produto</th>
                    <th>Qtd</th>
                    <th>Técnica</th>
                    <th>Status</th>
                    <th>Pgto</th>
                    <th>Entrega</th>
                    <th>Prazo</th>
                    <th className="center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id} className={p.status_producao === 'ATRASADO' ? 'row-red' : ''}>
                      <td className="td-num"><span className="num-pedido">#{p.num}</span></td>
                      <td className="td-cli">
                        <div className="nome-pedido">{p.cliente}</div>
                        <div className="muted">{p.nomePedidoOriginal} · {p.cor}</div>
                      </td>
                      <td className="td-meta" data-label="Qtd">{p.qtd}</td>
                      <td className="td-meta muted" data-label="Técnica">{p.tecnica}</td>
                      <td className="td-st">
                        <StatusCell p={p} onChange={s => setStatus(p.id, s)} />
                        {(p.status_producao === 'Em Produção' || p.status_producao === 'ATRASADO') && p.etapa && (
                          <div className="etapa-chip">{p.etapa}</div>
                        )}
                      </td>
                      <td className="td-meta" data-label="Pgto"><span className={`badge ${pgtoClass(p.status_pgto)}`}>{p.status_pgto}</span></td>
                      <td className="td-meta" data-label="Entrega">{p.entrega}</td>
                      <td className="td-meta muted" data-label="Prazo">{p.dias}</td>
                      <td className="td-act">
                        <div className="actions">
                          <button className="btn btn-sm btn-icon" title="Detalhes / histórico / OP" onClick={() => openDetalhe(p.id)}>
                            <Eye size={13} />
                          </button>
                          {p.status_producao !== 'Entregue' && (
                            <button className="btn btn-sm btn-green btn-icon" title="Marcar entregue" onClick={() => handleEntregue(p.id)}>
                              <CheckCircle size={13} />
                            </button>
                          )}
                          <button className="btn btn-sm btn-icon" title="Editar" onClick={() => openModal('editar', p)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-sm btn-danger btn-icon" title="Remover" onClick={() => handleDelete(p.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      }

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}
