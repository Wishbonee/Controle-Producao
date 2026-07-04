import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ConfirmModal() {
  const { confirmDialog, closeConfirm } = useApp();

  if (!confirmDialog) return null;

  const { title, message, confirmLabel = 'Confirmar', danger = false, onConfirm } = confirmDialog;

  async function handleConfirm() {
    closeConfirm();
    await onConfirm();
  }

  return (
    <div
      className="confirm-overlay"
      onClick={e => e.target === e.currentTarget && closeConfirm()}
    >
      <div className="confirm-card">
        <div className={`confirm-icon ${danger ? 'danger' : 'info'}`}>
          {danger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
        </div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-footer">
          <button className="btn" onClick={closeConfirm}>Cancelar</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
