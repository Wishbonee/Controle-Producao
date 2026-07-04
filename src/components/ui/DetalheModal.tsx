import { useState, useEffect } from 'react';
import { X, Printer, Pencil, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AuditEntry, PedidoEnriquecido, ETAPAS } from '../../types';
import { auditStorage } from '../../lib/auditStorage';
import { stClass, pgtoClass } from '../../lib/helpers';

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─── Ordem de Produção imprimível ───────────────────────────── */
function imprimirOP(p: PedidoEnriquecido) {
  const etapasHtml = ETAPAS.map(e => `
    <div class="op-etapa${p.etapa === e ? ' atual' : ''}">
      <span class="box">${p.etapa === e ? '&#9724;' : ''}</span> ${e}
    </div>`).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>OP #${p.num} — Wishbone</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 24px; color: #111; }
      .op-header { background: #111; color: #fff; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
      .op-header h1 { font-size: 18px; margin: 0; }
      .op-header .num { font-size: 26px; font-weight: 900; color: #E4F901; }
      .op-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 18px; }
      .op-item { border-bottom: 1px solid #e5e5e5; padding: 7px 0; }
      .op-label { font-size: 9px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: .6px; }
      .op-value { font-size: 14px; font-weight: 700; margin-top: 2px; }
      .op-qtd { font-size: 22px; font-weight: 900; }
      .op-section { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .8px; margin: 18px 0 8px; border-bottom: 2px solid #E4F901; padding-bottom: 4px; }
      .op-etapas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .op-etapa { display: flex; align-items: center; gap: 8px; font-weight: 700; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; }
      .op-etapa.atual { border-color: #111; background: #f5ffc4; }
      .op-etapa .box { width: 16px; height: 16px; border: 2px solid #111; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
      .op-obs { border: 1px dashed #bbb; border-radius: 8px; padding: 12px; min-height: 60px; font-size: 13px; }
      .op-foot { display: flex; justify-content: space-between; margin-top: 40px; gap: 24px; }
      .op-ass { flex: 1; border-top: 1px solid #111; padding-top: 6px; text-align: center; font-size: 10px; color: #666; }
      .gen { font-size: 10px; color: #999; margin-top: 22px; }
      @media print { body { padding: 8px; } }
    </style></head><body>
    <div class="op-header">
      <div>
        <h1>ORDEM DE PRODUÇÃO</h1>
        <div style="font-size:11px;opacity:.7">Wishbone Custom Caps</div>
      </div>
      <div class="num">#${p.num || 'S/N'}</div>
    </div>
    <div class="op-grid">
      <div class="op-item"><div class="op-label">Cliente</div><div class="op-value">${p.cliente || '—'}</div></div>
      <div class="op-item"><div class="op-label">Pedido</div><div class="op-value">${p.nomePedidoOriginal || '—'}</div></div>
      <div class="op-item"><div class="op-label">Quantidade</div><div class="op-value op-qtd">${p.qtd} un</div></div>
      <div class="op-item"><div class="op-label">Cor / Modelo</div><div class="op-value">${p.cor || '—'}</div></div>
      <div class="op-item"><div class="op-label">Técnica</div><div class="op-value">${p.tecnica || '—'}</div></div>
      <div class="op-item"><div class="op-label">Nº Sistema</div><div class="op-value">${p.numeroSistema || '—'}</div></div>
      <div class="op-item"><div class="op-label">Data de entrada</div><div class="op-value">${p.data || '—'}</div></div>
      <div class="op-item"><div class="op-label">Prazo de entrega</div><div class="op-value">${p.entrega || '—'} ${p.dias ? `(${p.dias})` : ''}</div></div>
    </div>
    <div class="op-section">Etapas de produção</div>
    <div class="op-etapas">${etapasHtml}</div>
    <div class="op-section">Observações</div>
    <div class="op-obs">${p.observacoes || ''}</div>
    <div class="op-foot">
      <div class="op-ass">Produção — data/assinatura</div>
      <div class="op-ass">Conferência — data/assinatura</div>
      <div class="op-ass">Expedição — data/assinatura</div>
    </div>
    <p class="gen">Gerado em ${new Date().toLocaleString('pt-BR')} — Wishbone Controle de Produção</p>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

/* ─── Modal de detalhes ──────────────────────────────────────── */
export function DetalheModal() {
  const { detalheId, closeDetalhe, pedidos, setEtapa, openModal, showToast } = useApp();
  const [timeline, setTimeline] = useState<AuditEntry[]>([]);
  const [loadingTl, setLoadingTl] = useState(false);

  const pedido = pedidos.find(p => p.id === detalheId) ?? null;

  useEffect(() => {
    if (!detalheId) return;
    setLoadingTl(true);
    auditStorage.getByPedido(detalheId)
      .then(setTimeline)
      .catch(() => setTimeline([]))
      .finally(() => setLoadingTl(false));
  }, [detalheId]);

  if (!detalheId || !pedido) return null;

  const emProducao = pedido.status_producao === 'Em Produção' || pedido.status_producao === 'ATRASADO';
  const etapaIdx = ETAPAS.indexOf((pedido.etapa ?? '') as typeof ETAPAS[number]);

  async function mudarEtapa(e: string) {
    if (!pedido || pedido.etapa === e) return;
    await setEtapa(pedido.id, e);
    showToast(`Etapa: ${e}`);
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && closeDetalhe()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>#{pedido.num || 'S/N'} — {pedido.cliente}</h2>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {pedido.nomePedidoOriginal}{pedido.cor ? ` · ${pedido.cor}` : ''} · {pedido.qtd} un
            </div>
          </div>
          <button className="close-btn" onClick={closeDetalhe}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ display: 'block' }}>
          {/* Resumo */}
          <div className="det-badges">
            <span className={`status-wrap ${stClass(pedido.status_producao)}`}>{pedido.status_producao}</span>
            <span className={`badge ${pgtoClass(pedido.status_pgto)}`}>{pedido.status_pgto}</span>
            {pedido.entrega && <span className="det-info">Entrega: <strong>{pedido.entrega}</strong>{pedido.dias ? ` · ${pedido.dias}` : ''}</span>}
            {pedido.tecnica && <span className="det-info">Técnica: <strong>{pedido.tecnica}</strong></span>}
          </div>

          {/* Stepper de etapas */}
          {emProducao && (
            <>
              <div className="det-section">Etapa de produção</div>
              <div className="det-stepper">
                {ETAPAS.map((e, i) => {
                  const done = etapaIdx >= 0 && i < etapaIdx;
                  const atual = i === etapaIdx;
                  return (
                    <button
                      key={e}
                      className={`det-step${atual ? ' atual' : ''}${done ? ' feita' : ''}`}
                      onClick={() => mudarEtapa(e)}
                      title={`Marcar etapa: ${e}`}
                    >
                      <span className="det-step-dot">{done ? <Check size={11} /> : i + 1}</span>
                      {e}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {pedido.observacoes && (
            <>
              <div className="det-section">Observações</div>
              <div className="det-obs">{pedido.observacoes}</div>
            </>
          )}

          {/* Timeline */}
          <div className="det-section">Histórico do pedido</div>
          {loadingTl
            ? <div className="det-tl-empty">Carregando histórico…</div>
            : timeline.length === 0
              ? <div className="det-tl-empty">Nenhum evento registrado ainda. Novas ações aparecerão aqui.</div>
              : (
                <div className="det-timeline">
                  {timeline.map(e => (
                    <div key={e.id} className="det-tl-item">
                      <div className="det-tl-dot" />
                      <div className="det-tl-body">
                        <div className="det-tl-head">
                          <strong>{e.acao}</strong>
                          <span>{fmtTs(e.ts)} · {e.nome_usuario}</span>
                        </div>
                        {e.detalhes && <div className="det-tl-det">{e.detalhes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => imprimirOP(pedido)}>
            <Printer size={14} /> Imprimir OP
          </button>
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn" onClick={() => { closeDetalhe(); openModal('editar', pedido); }}>
              <Pencil size={14} /> Editar
            </button>
            <button className="btn btn-primary" onClick={closeDetalhe}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
