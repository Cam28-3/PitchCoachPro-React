export default function Modal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
        style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 14, padding: 24 }}
      >
        <p style={{ color: '#e2e8f0', marginBottom: 16, lineHeight: 1.5, fontSize: 14 }}>{message}</p>
        <button className="btn btn-primary w-full" onClick={onClose} style={{ width: '100%' }}>
          OK
        </button>
      </div>
    </div>
  );
}
