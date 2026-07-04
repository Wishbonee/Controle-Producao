import { useMemo } from 'react';
import { CheckCircle, Pencil, PartyPopper } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { useApp } from '../../contexts/AppContext';
import { isUrgent, toDate } from '../../lib/helpers';

export function Urgentes() {
  const { pedidos, setStatus, openModal, showToast, openConfirm } = useApp();

  const urgentes = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return pedidos
      .filter(isUrgent)
      .sort((a, b) => {
        const da = toDate(a.entrega)?.getTime() ?? 0;
        const db = toDate(b.entrega)?.getTime() ?? 0;
        return da - db;
      });
  }, [pedidos]);

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

  function daysLabel(dias: string) {
    if (!dias) return { num: '—', label: '' };
    if (dias === 'Vence hoje') return { num: '0', label: 'hoje' };
    const m = dias.match(/(\d+)/);
    const n = m ? m[1] : '?';
    return dias.includes('atraso') ? { num: n, label: 'atraso' } : { num: n, label: 'dias' };
  }

  return (
    <>
      <div className="urgentes-header">
        <div className="info">
          <h2>Pedidos Urgentes</h2>
          <p>Atrasados e com entrega em até 3 dias</p>
        </div>
        <div className="urgentes-count">{urgentes.length}</div>
      </div>

      {urgentes.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="Tudo em dia!"
          description="Nenhum pedido atrasado ou com entrega nos próximos 3 dias."
        />
      ) : (
        urgentes.map(p => {
          const { num, label } = daysLabel(p.dias);
          return (
            <div key={p.id} className="urgent-card">
              <div className="urgent-days">
                <div className="dn">{num}</div>
                <div className="dl">{label || 'dias'}</div>
              </div>
              <div className="urgent-info">
                <div className="urgent-nome">{p.nome}</div>
                <div className="urgent-meta">
                  #{p.num} · {p.qtd} un · {p.tecnica || '—'} · Entrega: {p.entrega}
                </div>
              </div>
              <div className="urgent-acts">
                <button className="btn btn-sm btn-green" onClick={() => handleEntregue(p.id)}>
                  <CheckCircle size={13} /> Entregue
                </button>
                <button className="btn btn-sm" onClick={() => openModal('editar', p)}>
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
