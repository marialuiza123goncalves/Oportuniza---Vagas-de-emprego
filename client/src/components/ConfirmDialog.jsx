export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar exclusão', busy, onConfirm, onCancel }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <span className="dialog-icon" aria-hidden="true">!</span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button className="button button-danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
