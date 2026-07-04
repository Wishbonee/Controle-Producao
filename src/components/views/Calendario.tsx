import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PedidoEnriquecido } from '../../types';
import { toDate, stClass } from '../../lib/helpers';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface CalDay {
  date: Date;
  current: boolean;
  today: boolean;
  events: PedidoEnriquecido[];
}

function buildGrid(year: number, month: number, pedidos: PedidoEnriquecido[]): CalDay[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: CalDay[] = [];

  // Pad start
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, -first.getDay() + 1 + i);
    days.push({ date: d, current: false, today: false, events: [] });
  }

  for (let day = 1; day <= last.getDate(); day++) {
    const d = new Date(year, month, day);
    const events = pedidos.filter(p => {
      const pd = toDate(p.entrega);
      return pd && pd.getFullYear() === year && pd.getMonth() === month && pd.getDate() === day;
    });
    days.push({ date: d, current: true, today: d.getTime() === hoje.getTime(), events });
  }

  // Pad end to fill 6 rows
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1);
    days.push({ date: d, current: false, today: false, events: [] });
  }

  return days;
}

export function Calendario() {
  const { pedidos } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selKey, setSelKey] = useState<string | null>(null);

  const grid = useMemo(() => buildGrid(year, month, pedidos), [year, month, pedidos]);

  const selEvents = useMemo(() => {
    if (!selKey) return [];
    const [y, m, d] = selKey.split('-').map(Number);
    return pedidos.filter(p => {
      const pd = toDate(p.entrega);
      return pd && pd.getFullYear() === y && pd.getMonth() === m && pd.getDate() === d;
    });
  }, [selKey, pedidos]);

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelKey(null);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelKey(null);
  }

  function dayKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  return (
    <>
      <div className="cal-toolbar">
        <h2>{MESES[month]} {year}</h2>
        <div className="cal-toolbar-right">
          <button className="btn btn-sm btn-icon" onClick={prev}><ChevronLeft size={16} /></button>
          <button className="btn btn-sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelKey(null); }}>Hoje</button>
          <button className="btn btn-sm btn-icon" onClick={next}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="cal-grid-wrap">
      <div className="cal-grid">
        {DIAS.map(d => <div key={d} className="cal-head">{d}</div>)}
        {grid.map((cell, i) => {
          const key = dayKey(cell.date);
          const selected = selKey === key;
          return (
            <div
              key={i}
              className={`cal-cell${!cell.current ? ' other' : ''}${cell.today ? ' today' : ''}`}
              style={selected ? { outline: '2px solid #F5E400', outlineOffset: 1 } : undefined}
              onClick={() => setSelKey(selected ? null : key)}
            >
              <div className="cal-num">{cell.date.getDate()}</div>
              {cell.events.slice(0, 3).map(p => (
                <div key={p.id} className={`cal-ev ${stClass(p.status_producao)}`} title={p.nome}>
                  {p.cliente}
                </div>
              ))}
              {cell.events.length > 3 && (
                <div style={{ fontSize: 9, color: 'var(--muted)' }}>+{cell.events.length - 3} mais</div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {selKey && selEvents.length > 0 && (
        <div className="cal-detail-panel">
          <h4>
            {(() => {
              const [y, m, d] = selKey.split('-').map(Number);
              return `${d} de ${MESES[m]} de ${y}`;
            })()}
          </h4>
          {selEvents.map(p => (
            <div key={p.id} className="cal-detail-row">
              <span className="num">#{p.num}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{p.nome}</span>
              <span className={`status-wrap ${stClass(p.status_producao)}`}>{p.status_producao}</span>
              <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>{p.dias}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
