import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { OrderItem } from '../../types/trading';
import { Cancel3D, Completed3D } from '../ui/icons3d';
import { fmtQty } from '../../lib/format';

export interface CancelOrderModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [isCancelled, setIsCancelled] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    setIsCancelled(true);
    setTimeout(() => {
      onConfirmCancel(order.id);
      setIsCancelled(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isCancelled}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isCancelled ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="mb-3">
              <Completed3D size={48} />
            </div>
            <h3 className="text-base font-bold text-brand-text">
              Order Cancelled
            </h3>
            <p className="text-xs text-brand-muted mt-1 max-w-xs">
              Order {order.id} has been successfully cancelled in the local paper trading simulation.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Cancel3D size={38} />
              <div>
                <h3 id="cancel-order-title" className="text-base font-bold text-brand-text">
                  Cancel Paper Order
                </h3>
                <p className="text-xs text-brand-muted">
                  Are you sure you want to cancel this order?
                </p>
              </div>
            </div>

            {/* Order Overview */}
            <div className="my-4 p-3.5 rounded-xl bg-brand-bg border border-brand-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-muted">Order ID:</span>
                <span className="font-mono font-bold text-brand-text">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Symbol / Action:</span>
                <span className="font-semibold text-brand-text">
                  {order.side} {order.symbol} ({order.type})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Quantity:</span>
                <span className="font-mono font-bold text-brand-text">
                  {fmtQty(order.quantity)} shares
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-border/60">
                <span className="text-brand-muted">Current Status:</span>
                <span className="font-semibold text-brand-primary">{order.status}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-xl bg-pink-50 border border-brand-border text-[11px] text-brand-sidebar leading-relaxed mb-5">
              Cancelling will remove this resting order from the paper book. No live exchange transactions will occur.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-danger text-white hover:bg-red-700 shadow-sm transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

