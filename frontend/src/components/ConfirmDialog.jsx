// Small reusable confirmation modal.
export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {message && <p className="muted">{message}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'danger' : ''} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
