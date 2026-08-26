import React from 'react';

interface DirtyFormConfirmProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DirtyFormConfirm: React.FC<DirtyFormConfirmProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dirty-form-confirm-overlay">
      <div className="dirty-form-confirm-modal">
        <div className="dirty-form-confirm-header">
          <h3>Unsaved Changes</h3>
        </div>
        <div className="dirty-form-confirm-body">
          <p>{message}</p>
        </div>
        <div className="dirty-form-confirm-footer">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Discard Changes
          </button>
        </div>
      </div>

      <style>{`
        .dirty-form-confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        .dirty-form-confirm-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.2s ease;
        }

        .dirty-form-confirm-header {
          margin-bottom: 16px;
        }

        .dirty-form-confirm-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a2e;
        }

        .dirty-form-confirm-body {
          margin-bottom: 24px;
        }

        .dirty-form-confirm-body p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
          color: #4a4a6a;
        }

        .dirty-form-confirm-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
