import { useState, useMemo } from 'react';
import { FileDown, FileText, User, CalendarRange, Building2, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PedidoEnriquecido } from '../../types';
import { stClass, toDate, toInputDate } from '../../lib/helpers';
import { Select, STATUS_PRODUCAO_OPTS } from '../ui/Select';

function fmtInputDate(v: string): string {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
}

function buildPeriodo(de: string, ate: string): string {
  if (de && ate)  return `${fmtInputDate(de)} até ${fmtInputDate(ate)}`;
  if (de)         return `A partir de ${fmtInputDate(de)}`;
  if (ate)        return `Até ${fmtInputDate(ate)}`;
  return 'Todos os períodos';
}

function exportCSV(pedidos: PedidoEnriquecido[]) {
  const header = ['Nº', 'Data', 'Cliente', 'Pedido', 'Qtd', 'Cor', 'Técnica', 'Status', 'Pgto', 'Entrega', 'Prazo', 'Obs'];
  const rows = pedidos.map(p => [
    p.num, p.data, p.cliente, p.nomePedidoOriginal, p.qtd, p.cor,
    p.tecnica, p.status_producao, p.status_pgto, p.entrega, p.dias, p.observacoes,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = '﻿' + [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `wishbone-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(
  pedidos: PedidoEnriquecido[],
  meta: { usuario: string; periodo: string; cliente: string; stats: { total: number; pecas: number; entregues: number; atrasados: number } }
) {
  const rows = pedidos.map(p => `
    <tr>
      <td>${p.num}</td><td>${p.cliente}</td><td>${p.nomePedidoOriginal}</td>
      <td>${p.qtd}</td><td>${p.tecnica}</td><td>${p.status_producao}</td>
      <td>${p.entrega}</td><td>${p.dias}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório Wishbone</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
      .rep-header { background: #111; color: #fff; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; }
      .rep-header h1 { font-size: 16px; margin: 0 0 10px; }
      .rep-meta { display: flex; gap: 24px; flex-wrap: wrap; }
      .rep-meta-item { display: flex; flex-direction: column; gap: 2px; }
      .rep-meta-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: .8px; }
      .rep-meta-value { font-size: 13px; font-weight: 700; color: #E4F901; }
      .rep-stats { display: flex; gap: 16px; margin-bottom: 16px; }
      .rep-stat-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; text-align: center; }
      .rep-stat-box .v { font-size: 20px; font-weight: 900; }
      .rep-stat-box .l { font-size: 10px; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #111; color: #fff; padding: 7px 9px; font-size: 10px; text-align: left; }
      td { padding: 6px 9px; border-bottom: 1px solid #eee; font-size: 11px; }
      tr:nth-child(even) { background: #fafafa; }
      .gen { font-size: 10px; color: #999; margin-top: 12px; }
    </style></head><body>
    <div class="rep-header">
      <h1>Relatório de Produção — Wishbone</h1>
      <div class="rep-meta">
        <div class="rep-meta-item">
          <span class="rep-meta-label">Usuário</span>
          <span class="rep-meta-value">${meta.usuario}</span>
        </div>
        <div class="rep-meta-item">
          <span class="rep-meta-label">Período</span>
          <span class="rep-meta-value">${meta.periodo}</span>
        </div>
        <div class="rep-meta-item">
          <span class="rep-meta-label">Cliente</span>
          <span class="rep-meta-value">${meta.cliente}</span>
        </div>
      </div>
    </div>
    <div class="rep-stats">
      <div class="rep-stat-box"><div class="v">${meta.stats.total}</div><div class="l">Pedidos</div></div>
      <div class="rep-stat-box"><div class="v">${meta.stats.pecas}</div><div class="l">Peças</div></div>
      <div class="rep-stat-box"><div class="v">${meta.stats.entregues}</div><div class="l">Entregues</div></div>
      <div class="rep-stat-box"><div class="v">${meta.stats.atrasados}</div><div class="l">Atrasados</div></div>
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Cliente</th><th>Pedido</th><th>Qtd</th><th>Técnica</th><th>Status</th><th>Entrega</th><th>Prazo</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="gen">Gerado em ${new Date().toLocaleString('pt-BR')} por ${meta.usuario}</p>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

export function Relatorios() {
  const { pedidos, nome } = useApp();

  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterDe,      setFilterDe]      = useState('');
  const [filterAte,     setFilterAte]     = useState('');

  const clienteOpts = useMemo(() =>
    Array.from(new Set(pedidos.map(p => p.cliente).filter(Boolean)))
      .sort()
      .map(c => ({ value: c, label: c })),
  [pedidos]);

  const filtered = useMemo(() => pedidos.filter(p => {
    if (filterStatus  && p.status_producao !== filterStatus)  return false;
    if (filterCliente && p.cliente         !== filterCliente) return false;
    if (filterDe || filterAte) {
      const pd = toDate(p.data);
      if (!pd) return false;
      const pStr = toInputDate(p.data);
      if (filterDe  && pStr < filterDe)  return false;
      if (filterAte && pStr > filterAte) return false;
    }
    return true;
  }), [pedidos, filterStatus, filterCliente, filterDe, filterAte]);

  const stats = useMemo(() => ({
    total:     filtered.length,
    atrasados: filtered.filter(p => p.status_producao === 'ATRASADO').length,
    entregues: filtered.filter(p => p.status_producao === 'Entregue').length,
    pecas:     filtered.reduce((s, p) => s + p.qtd, 0),
    pagos:     filtered.filter(p => p.status_pgto === 'PAGO').length,
  }), [filtered]);

  const periodoLabel  = buildPeriodo(filterDe, filterAte);
  const clienteLabel  = filterCliente || 'Todos os clientes';
  const usuarioLabel  = nome ?? '—';

  const hasFilter = !!(filterStatus || filterCliente || filterDe || filterAte);

  function limpar() {
    setFilterStatus('');
    setFilterCliente('');
    setFilterDe('');
    setFilterAte('');
  }

  function handleExportPDF() {
    exportPDF(filtered, {
      usuario: usuarioLabel,
      periodo: periodoLabel,
      cliente: clienteLabel,
      stats,
    });
  }

  return (
    <>
      {/* ── Banner de contexto ── */}
      <div className="rep-summary">
        <div className="rep-summary-item">
          <span className="rep-summary-label"><User size={11} /> Usuário</span>
          <span className="rep-summary-value">{usuarioLabel}</span>
        </div>
        <div className="rep-summary-sep" />
        <div className="rep-summary-item">
          <span className="rep-summary-label"><CalendarRange size={11} /> Período</span>
          <span className={`rep-summary-value${!filterDe && !filterAte ? ' rep-summary-muted' : ''}`}>
            {periodoLabel}
          </span>
        </div>
        <div className="rep-summary-sep" />
        <div className="rep-summary-item">
          <span className="rep-summary-label"><Building2 size={11} /> Cliente</span>
          <span className={`rep-summary-value${!filterCliente ? ' rep-summary-muted' : ''}`}>
            {clienteLabel}
          </span>
        </div>
        <div className="rep-summary-sep" />
        <div className="rep-summary-item">
          <span className="rep-summary-label"><Package size={11} /> Resultado</span>
          <span className="rep-summary-value">
            {stats.total} pedido{stats.total !== 1 ? 's' : ''} · {stats.pecas.toLocaleString('pt-BR')} peças
          </span>
        </div>
      </div>

      {/* ── Filtros + exportar ── */}
      <div className="rep-card">
        <h3>Filtros e Exportação</h3>
        <p>Defina o período e os filtros, depois exporte em PDF ou CSV.</p>

        <div className="rep-filters">
          {/* Período de/até */}
          <div className="filter-group">
            <label>De</label>
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

          {/* Cliente */}
          <div className="filter-group">
            <label>Cliente</label>
            <Select
              value={filterCliente}
              onChange={setFilterCliente}
              options={clienteOpts}
              placeholder="Todos os clientes"
              compact
            />
          </div>

          {/* Status */}
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

          {hasFilter && (
            <div className="filter-group filter-actions" style={{ alignSelf: 'flex-end' }}>
              <button className="rep-btn" onClick={limpar}>Limpar filtros</button>
            </div>
          )}
        </div>

        <div className="rep-stats">
          <div className="rep-stat"><div className="v">{stats.total}</div><div className="l">Pedidos</div></div>
          <div className="rep-stat"><div className="v" style={{ color: 'var(--danger-text)' }}>{stats.atrasados}</div><div className="l">Atrasados</div></div>
          <div className="rep-stat"><div className="v" style={{ color: 'var(--success-text)' }}>{stats.entregues}</div><div className="l">Entregues</div></div>
          <div className="rep-stat"><div className="v">{stats.pecas.toLocaleString('pt-BR')}</div><div className="l">Peças</div></div>
        </div>

        <div className="rep-actions" style={{ marginTop: 16 }}>
          <button className="rep-btn rep-btn-pdf" onClick={handleExportPDF}>
            <FileText size={16} /> Exportar PDF
          </button>
          <button className="rep-btn rep-btn-csv" onClick={() => exportCSV(filtered)}>
            <FileDown size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="table-card">
        <div className="month-header">
          <span>Prévia — {filtered.length} pedido(s)</span>
          <span className="month-count">{stats.pagos} pagos</span>
        </div>
        {filtered.length === 0
          ? <div className="empty">Nenhum pedido com esses filtros.</div>
          : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nº</th><th>Cliente</th><th>Pedido</th><th>Qtd</th>
                    <th>Técnica</th><th>Status</th><th>Entrega</th><th>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className={p.status_producao === 'ATRASADO' ? 'row-red' : ''}>
                      <td><span className="num-pedido">#{p.num}</span></td>
                      <td><span className="nome-pedido">{p.cliente}</span></td>
                      <td className="muted">{p.nomePedidoOriginal}</td>
                      <td>{p.qtd}</td>
                      <td className="muted">{p.tecnica}</td>
                      <td><span className={`status-wrap ${stClass(p.status_producao)}`}>{p.status_producao}</span></td>
                      <td>{p.entrega}</td>
                      <td className="muted">{p.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </>
  );
}
