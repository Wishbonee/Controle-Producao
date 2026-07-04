import { useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle, Clock, HardHat, Trophy } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PedidoEnriquecido } from '../../types';
import { toDate } from '../../lib/helpers';

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ─── Donut SVG ─────────────────────────────────────────────── */
function DonutChart({ slices, size = 140 }: {
  slices: { color: string; value: number; label: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', width: size, height: size, flexShrink: 0 }}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line, #eee)" strokeWidth={size * 0.13} />
      ) : (
        slices.filter(s => s.value > 0).map((slice, i) => {
          const dash = (slice.value / total) * circ;
          const off = offset;
          offset += dash;
          return (
            <circle
              key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={slice.color}
              strokeWidth={size * 0.13}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-off}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          );
        })
      )}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--card, #fff)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.14} fontWeight="900" fill="var(--text, #111)">
        {total}
      </text>
    </svg>
  );
}

/* ─── Gráfico mensal ─────────────────────────────────────────── */
function MonthlyChart({ pedidos }: { pedidos: PedidoEnriquecido[] }) {
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const bonos = pedidos
        .filter(p => {
          const pd = toDate(p.data);
          return pd && pd.getFullYear() === year && pd.getMonth() === month;
        })
        .reduce((s, p) => s + p.qtd, 0);
      return { label: `${MESES_ABREV[month]}/${String(year).slice(2)}`, bonos };
    });
  }, [pedidos]);

  const maxVal = Math.max(...months.map(m => m.bonos), 1);

  return (
    <div className="month-chart">
      {months.map(({ label, bonos }) => (
        <div key={label} className="month-bar-group">
          {bonos > 0 && <div className="month-bar-val">{bonos}</div>}
          <div
            className="month-bar"
            style={{ height: `${(bonos / maxVal) * 100}%` }}
            title={`${bonos} bonés`}
          />
          <div className="month-bar-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Ranking de clientes ────────────────────────────────────── */
function TopClientes({ pedidos }: { pedidos: PedidoEnriquecido[] }) {
  const ranking = useMemo(() => {
    const map: Record<string, { qtd: number; pedidos: number }> = {};
    pedidos.forEach(p => {
      if (!map[p.cliente]) map[p.cliente] = { qtd: 0, pedidos: 0 };
      map[p.cliente].qtd += p.qtd;
      map[p.cliente].pedidos++;
    });
    return Object.entries(map)
      .map(([nome, s]) => ({ nome, ...s }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [pedidos]);

  const maxQtd = ranking[0]?.qtd ?? 1;

  const medalClass = (i: number) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

  return (
    <>
      {ranking.map((c, i) => (
        <div key={c.nome} className="rank-item">
          <div className={`rank-num ${medalClass(i)}`}>{i + 1}</div>
          <div className="rank-info">
            <div className="rank-nome">{c.nome}</div>
            <div className="rank-meta">{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''} · {c.qtd} bonés</div>
          </div>
          <div className="rank-bar-wrap">
            <div className="rank-bar-track">
              <div className="rank-bar-fill" style={{ width: `${(c.qtd / maxQtd) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Próximas Entregas ──────────────────────────────────────── */
function ProximasEntregas({ pedidos }: { pedidos: PedidoEnriquecido[] }) {
  const upcoming = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return pedidos
      .filter(p => p.status_producao !== 'Entregue' && p.status_producao !== 'Cancelado')
      .map(p => ({ p, d: toDate(p.entrega) }))
      .filter(({ d }) => d && d >= hoje)
      .sort((a, b) => a.d!.getTime() - b.d!.getTime())
      .slice(0, 5);
  }, [pedidos]);

  if (!upcoming.length) {
    return <div className="empty-msg" style={{ padding: '24px 0' }}>Nenhuma entrega futura.</div>;
  }

  return (
    <>
      {upcoming.map(({ p, d }) => (
        <div key={p.id} className="delivery-item">
          <div className="delivery-date-box">
            <span className="d">{d!.getDate()}</span>
            <span className="m">{MESES_ABREV[d!.getMonth()]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="delivery-nome">{p.cliente}</div>
            <div className="delivery-meta">{p.nomePedidoOriginal} · {p.qtd} un · {p.tecnica || '—'}</div>
          </div>
          <span
            className={`status-wrap ${p.status_producao === 'ATRASADO' ? 'st-atrasado' : 'st-em'}`}
            style={{ fontSize: 10, flexShrink: 0 }}
          >
            {p.dias}
          </span>
        </div>
      ))}
    </>
  );
}

/* ─── Dashboard principal ────────────────────────────────────── */
export function Dashboard() {
  const { pedidos } = useApp();

  const stats = useMemo(() => {
    const atrasados = pedidos.filter(p => p.status_producao === 'ATRASADO');
    const entregues = pedidos.filter(p => p.status_producao === 'Entregue');
    const pendentes = pedidos.filter(p => p.status_pgto === 'PENDENTE' && p.status_producao !== 'Cancelado');
    const totalBonos = pedidos.reduce((s, p) => s + p.qtd, 0);
    const emAndamento = pedidos.filter(p => !['Entregue','Cancelado'].includes(p.status_producao));
    return { total: pedidos.length, atrasados: atrasados.length, entregues: entregues.length, pendentes: pendentes.length, totalBonos, emAndamento: emAndamento.length };
  }, [pedidos]);

  const byStatus = useMemo(() => {
    const c: Record<string, number> = {};
    pedidos.forEach(p => { c[p.status_producao] = (c[p.status_producao] ?? 0) + 1; });
    return [
      { label: 'Em Produção', value: c['Em Produção'] ?? 0, color: '#fde047' },
      { label: 'Aguardando',  value: c['Aguardando']  ?? 0, color: '#fb923c' },
      { label: 'Enviado',     value: c['Enviado']     ?? 0, color: '#60a5fa' },
      { label: 'Entregue',    value: c['Entregue']    ?? 0, color: '#4ade80' },
      { label: 'Atrasado',    value: c['ATRASADO']    ?? 0, color: '#f87171' },
    ];
  }, [pedidos]);

  return (
    <>
      {/* ── KPIs ── */}
      <div className="kpis kpis-4">
        <div className="kpi kpi-accent-yellow">
          <div className="kpi-icon"><HardHat size={20} /></div>
          <div className="kpi-label">Bonés em Produção</div>
          <div className="kpi-value">{stats.emAndamento}</div>
          <div className="kpi-sub">{stats.totalBonos.toLocaleString('pt-BR')} un no total</div>
        </div>

        <div className="kpi kpi-accent-red">
          <div className="kpi-icon" style={{ color: '#ef4444' }}><AlertTriangle size={20} /></div>
          <div className="kpi-label">Atrasados</div>
          <div className="kpi-value" style={{ color: stats.atrasados > 0 ? 'var(--danger-text, #b91c1c)' : 'var(--text)' }}>
            {stats.atrasados}
          </div>
          <div className="kpi-sub">de {stats.total} pedidos</div>
          {stats.total > 0 && (
            <div className="kpi-bar">
              <div className="kpi-bar-fill" style={{ width: `${(stats.atrasados / stats.total) * 100}%`, background: '#ef4444' }} />
            </div>
          )}
        </div>

        <div className="kpi kpi-accent-green">
          <div className="kpi-icon" style={{ color: '#16a34a' }}><CheckCircle size={20} /></div>
          <div className="kpi-label">Entregues</div>
          <div className="kpi-value">{stats.entregues}</div>
          <div className="kpi-sub">
            {stats.total > 0 ? Math.round((stats.entregues / stats.total) * 100) : 0}% de conclusão
          </div>
          {stats.total > 0 && (
            <div className="kpi-bar">
              <div className="kpi-bar-fill" style={{ width: `${(stats.entregues / stats.total) * 100}%`, background: '#4ade80' }} />
            </div>
          )}
        </div>

        <div className="kpi kpi-accent-blue">
          <div className="kpi-icon" style={{ color: '#3b82f6' }}><Clock size={20} /></div>
          <div className="kpi-label">Pgto Pendente</div>
          <div className="kpi-value">{stats.pendentes}</div>
          <div className="kpi-sub">pedidos aguardando</div>
        </div>
      </div>

      {/* ── Gráfico mensal + Status ── */}
      <div className="dash-row dash-row-2-1">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Produção Mensal (bonés por mês de entrada)</h3>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>últimos 6 meses</span>
          </div>
          <div className="dash-card-body">
            <MonthlyChart pedidos={pedidos} />
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header"><h3>Status dos Pedidos</h3></div>
          <div className="dash-card-body">
            <div className="chart-wrap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
              <DonutChart slices={byStatus} size={110} />
              <div className="chart-legend" style={{ width: '100%' }}>
                {byStatus.map(s => (
                  <div key={s.label} className="legend-row">
                    <div className="legend-dot" style={{ background: s.color }} />
                    <span className="legend-label">{s.label}</span>
                    <span className="legend-val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ranking + Próximas entregas ── */}
      <div className="dash-row dash-row-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Ranking de Clientes</h3>
            <Trophy size={14} style={{ color: '#fbbf24' }} />
          </div>
          <div className="dash-card-body">
            {pedidos.length === 0
              ? <div className="empty-msg">Sem pedidos ainda.</div>
              : <TopClientes pedidos={pedidos} />
            }
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header"><h3>Próximas Entregas</h3></div>
          <div className="dash-card-body">
            <ProximasEntregas pedidos={pedidos} />
          </div>
        </div>
      </div>

      {/* ── Resumo por tipo de produto ── */}
      <div className="dash-row">
        <div className="dash-card">
          <div className="dash-card-header"><h3>Volume por Técnica de Personalização</h3></div>
          <div className="dash-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {(() => {
              const byTecnica: Record<string, { pedidos: number; bonos: number }> = {};
              pedidos.forEach(p => {
                const t = p.tecnica || 'Não informada';
                if (!byTecnica[t]) byTecnica[t] = { pedidos: 0, bonos: 0 };
                byTecnica[t].pedidos++;
                byTecnica[t].bonos += p.qtd;
              });
              return Object.entries(byTecnica)
                .sort((a, b) => b[1].bonos - a[1].bonos)
                .map(([tecnica, s]) => (
                  <div key={tecnica} style={{
                    background: 'var(--subtle)', borderRadius: 10, padding: '12px 14px',
                    borderLeft: '3px solid var(--yellow)',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 4 }}>{tecnica}</div>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>{s.bonos.toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      bonés · {s.pedidos} ped.
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
