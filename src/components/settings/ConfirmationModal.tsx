import React from 'react';
import { X } from 'lucide-react';
import { Warning3D, Error3D } from '../ui/icons3d';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
          {confirmVariant === 'danger' ? (
            <Error3D size={38} />
          ) : (
            <Warning3D size={38} />
          )}
          <div>
            <h3 className="text-base font-bold text-brand-text">{title}</h3>
            <p className="text-xs text-brand-muted">Please confirm this action</p>
          </div>
        </div>

        <div className="my-4 text-xs text-brand-muted leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-colors ${
              confirmVariant === 'danger'
                ? 'bg-brand-danger hover:bg-red-700'
                : 'bg-brand-primary hover:bg-brand-sidebar'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
