import { X, AlertTriangle } from 'lucide-react';

function DeleteConfirmModal({ isOpen, onClose, onConfirm, roomName, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal rm-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <h3>Delete Room</h3>
          <button type="button" className="rm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="rm-modal-body rm-delete-body">
          <div className="rm-delete-icon">
            <AlertTriangle size={32} />
          </div>
          <p>Are you sure you want to delete <strong>{roomName}</strong>?</p>
          <p className="rm-delete-hint">This action cannot be undone.</p>
        </div>
        <div className="rm-modal-footer">
          <button type="button" className="rm-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="rm-btn-delete" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
