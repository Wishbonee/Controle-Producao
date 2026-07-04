import { useRef, useState, DragEvent } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, CopyX, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { parsePlanilha, ImportResult } from '../../lib/importPedidos';
import { stClass } from '../../lib/helpers';

const PREVIEW_MAX = 8;
const ERROS_MAX = 5;

export function ImportModal({ onClose }: { onClose: () => void }) {
  const { pedidos, importPedidos, showToast } = useApp();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File | undefined | null) {
    if (!f) return;
    setFileName(f.name);
    try {
      const isCsv = /\.csv$/i.test(f.name);
      const dados = isCsv ? await f.text() : await f.arrayBuffer();
      setResult(await parsePlanilha(dados, pedidos));
    } catch {
      showToast('Não foi possível ler o arquivo. Use .xlsx ou .csv no modelo padrão.', true);
      setResult(null);
      setFileName('');
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!result || result.validos.length === 0 || importing) return;
    setImporting(true);
    try {
      const n = await importPedidos(result.validos);
      showToast(`${n} pedido${n !== 1 ? 's' : ''} importado${n !== 1 ? 's' : ''} com sucesso!`);
      onClose();
    } catch {
      setImporting(false); // toast de erro já exibido pelo contexto
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget && !importing) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>Importar planilha de pedidos</h2>
          <button className="close-btn" onClick={onClose} disabled={importing}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'block' }}>
          {/* ── Zona de upload ── */}
          <div
            className={`import-drop${dragOver ? ' drag-over' : ''}${fileName ? ' has-file' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            {fileName
              ? <><FileSpreadsheet size={22} /><strong>{fileName}</strong><span>Clique para trocar o arquivo</span></>
              : <><Upload size={22} /><strong>Clique ou arraste a planilha aqui</strong><span>.xlsx ou .csv — colunas: DATA, Nº PEDIDO, QUANT., CLIENTE, NOME DO PEDIDO, COR, Nº SISTEMA, LOGOMARCA, STATUS, PGTO, ENTREGA, OBSERVAÇÕES</span></>
            }
          </div>

          {/* ── Resumo da análise ── */}
          {result && (
            <>
              <div className="import-summary">
                <div className="import-stat ok">
                  <CheckCircle2 size={15} />
                  <strong>{result.validos.length}</strong> para importar
                </div>
                {result.duplicados > 0 && (
                  <div className="import-stat dup">
                    <CopyX size={15} />
                    <strong>{result.duplicados}</strong> duplicado{result.duplicados !== 1 ? 's' : ''} (ignorados)
                  </div>
                )}
                {result.invalidos.length > 0 && (
                  <div className="import-stat err">
                    <AlertTriangle size={15} />
                    <strong>{result.invalidos.length}</strong> com erro
                  </div>
                )}
              </div>

              {result.invalidos.length > 0 && (
                <div className="import-errors">
                  {result.invalidos.slice(0, ERROS_MAX).map(e => (
                    <div key={e.linha}>Linha {e.linha}: {e.motivo}</div>
                  ))}
                  {result.invalidos.length > ERROS_MAX && (
                    <div>… e mais {result.invalidos.length - ERROS_MAX} linha(s) com erro.</div>
                  )}
                </div>
              )}

              {/* ── Prévia ── */}
              {result.validos.length > 0 && (
                <div className="import-preview">
                  <table className="cfg-table">
                    <thead>
                      <tr><th>Nº</th><th>Cliente</th><th>Pedido</th><th>Qtd</th><th>Status</th><th>Entrega</th></tr>
                    </thead>
                    <tbody>
                      {result.validos.slice(0, PREVIEW_MAX).map((p, i) => (
                        <tr key={i}>
                          <td><span className="num-pedido">{p.num ? `#${p.num}` : '—'}</span></td>
                          <td>{p.cliente}</td>
                          <td className="muted">{p.nomePedidoOriginal}</td>
                          <td>{p.qtd}</td>
                          <td><span className={`status-wrap ${stClass(p.status_producao)}`}>{p.status_producao}</span></td>
                          <td>{p.entrega || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.validos.length > PREVIEW_MAX && (
                    <div className="import-more">… e mais {result.validos.length - PREVIEW_MAX} pedidos.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={importing}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!result || result.validos.length === 0 || importing}
          >
            {importing
              ? <><Loader2 size={14} className="spin" /> Importando…</>
              : `Importar ${result?.validos.length ?? 0} pedido${(result?.validos.length ?? 0) !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
