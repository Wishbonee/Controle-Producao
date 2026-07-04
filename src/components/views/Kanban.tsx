import { useMemo, useState, DragEvent } from 'react';
import { CheckCircle, Pencil, CalendarRange } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PedidoEnriquecido, StatusProducao } from '../../types';
import { pgtoClass, kBorderClass, toInputDate } from '../../lib/helpers';

const COLS: { status: StatusProducao; label: string; hClass: string }[] = [
  { status: 'Em Produção', label: 'Em Produção', hClass: 'kh-em' },
  { status: 'Aguardando',  label: 'Aguardando',  hClass: 'kh-aguardando' },
  { status: 'ATRASADO',   label: 'Atrasado',    hClass: 'kh-atrasado' },
  { status: 'Enviado',    label: 'Enviado',     hClass: 'kh-enviado' },
  { status: 'Entregue',   label: 'Entregue',    hClass: 'kh-entregue' },
  { status: 'Cancelado',  label: 'Cancelado',   hClass: 'kh-cancelado' },
];

function KCard({ p, dragging, onDragStart, onDragEnd, onEntregue, onEdit, onDetalhe }: {
  p: PedidoEnriquecido;
  dragging: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onEntregue: () => void;
  onEdit: () => void;
  onDetalhe: () => void;
}) {
  return (
    <div
      className={`k-card ${kBorderClass(p.status_producao)}${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={e => { if (!(e.target as HTMLElement).closest('button')) onDetalhe(); }}
      style={{ cursor: 'pointer' }}
      title="Ver detalhes"
    >
      <div className="k-card-num">#{p.num || 'S/N'}</div>
      <div className="k-card-nome">{p.cliente}</div>
      <div className="k-card-meta">
        <span>{p.nomePedidoOriginal}</span>
        <span>· {p.qtd} un</span>
      </div>
      {(p.status_producao === 'Em Produção' || p.status_producao === 'ATRASADO') && p.etapa && (
        <div className="etapa-chip">{p.etapa}</div>
      )}
      <div className="k-card-foot">
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.entrega}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className={`badge ${pgtoClass(p.status_pgto)}`} style={{ fontSize: 9 }}>{p.status_pgto}</span>
          {p.status_producao !== 'Entregue' && (
            <button className="btn btn-icon btn-sm btn-green" title="Marcar entregue" onClick={onEntregue}>
              <CheckCircle size={12} />
            </button>
          )}
          <button className="btn btn-icon btn-sm" title="Editar" onClick={onEdit}>
            <Pencil size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Kanban() {
  const { pedidos, setStatus, openModal, showToast, openConfirm, openDetalhe } = useApp();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<StatusProducao | null>(null);
  const [filterDe, setFilterDe] = useState('');
  const [filterAte, setFilterAte] = useState('');

  // Filtro por data do pedido
  const filtrados = useMemo(() => {
    if (!filterDe && !filterAte) return pedidos;
    return pedidos.filter(p => {
      const d = toInputDate(p.data);
      if (!d) return false;
      if (filterDe && d < filterDe) return false;
      if (filterAte && d > filterAte) return false;
      return true;
    });
  }, [pedidos, filterDe, filterAte]);

  const byStatus = useMemo(() => {
    const map = new Map<StatusProducao, PedidoEnriquecido[]>();
    COLS.forEach(c => map.set(c.status, []));
    filtrados.forEach(p => {
      const col = map.get(p.status_producao);
      if (col) col.push(p);
    });
    return map;
  }, [filtrados]);

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

  function handleDragStart(e: DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverCol(null);
  }

  function handleDragOver(e: DragEvent, status: StatusProducao) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overCol !== status) setOverCol(status);
  }

  async function handleDrop(e: DragEvent, status: StatusProducao) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setOverCol(null);
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || pedido.status_producao === status) return;
    await setStatus(id, status);
    showToast(`#${pedido.num} → ${status}`);
  }

  const temFiltro = !!(filterDe || filterAte);

  return (
    <>
      <div className="controls-bar">
        <div className="filter-group">
          <label>De (data do pedido)</label>
          <input
            type="date"
            className="rep-date-input"
            value={filterDe}
            onChange={e => setFilterDe(e.target.value)}
            max={filterAte || undefined}
          />
        </div>
        <div className="filter-group">
          <label>Até</label>
          <input
            type="date"
            className="rep-date-input"
            value={filterAte}
            onChange={e => setFilterAte(e.target.value)}
            min={filterDe || undefined}
          />
        </div>
        {temFiltro && (
          <div className="filter-group filter-actions">
            <button className="btn btn-sm" onClick={() => { setFilterDe(''); setFilterAte(''); }}>
              Limpar
            </button>
          </div>
        )}
        <div className="kanban-filter-info">
          <CalendarRange size={13} />
          {temFiltro
            ? `${filtrados.length} de ${pedidos.length} pedidos no período`
            : `${pedidos.length} pedidos`
          }
        </div>
      </div>

      <div className="kanban-board">
      {COLS.map(({ status, label, hClass }) => {
        const items = byStatus.get(status) ?? [];
        return (
          <div
            key={status}
            className={`kanban-col${overCol === status && draggingId ? ' drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, status)}
            onDragLeave={() => setOverCol(c => (c === status ? null : c))}
            onDrop={e => handleDrop(e, status)}
          >
            <div className={`kanban-col-header ${hClass}`}>
              <span>{label}</span>
              <span className="k-col-count">{items.length}</span>
            </div>
            <div className="kanban-col-body">
              {items.length === 0
                ? <div className="k-empty">Arraste um card aqui</div>
                : items.map(p => (
                  <KCard
                    key={p.id}
                    p={p}
                    dragging={draggingId === p.id}
                    onDragStart={e => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    onEntregue={() => handleEntregue(p.id)}
                    onEdit={() => openModal('editar', p)}
                    onDetalhe={() => openDetalhe(p.id)}
                  />
                ))
              }
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
}
