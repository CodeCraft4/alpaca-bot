import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { OpenPosition } from '../../types/trading';
import { Warning3D, Completed3D } from '../ui/icons3d';
import { fmtQty } from '../../lib/format';

export interface SellConfirmationModalProps {
  position: OpenPosition | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSell?: (position: OpenPosition) => void;
}

export const SellConfirmationModal: React.FC<SellConfirmationModalProps> = ({
  position,
  isOpen,
  onClose,
  onConfirmSell,
}) => {
  const [isSimulatedSubmitted, setIsSimulatedSubmitted] = useState(false);

  if (!isOpen || !position) return null;

  const handleConfirm = () => {
    // Pure simulated action — updates central context
    setIsSimulatedSubmitted(true);
    if (onConfirmSell && position) {
      onConfirmSell(position);
    }
    setTimeout(() => {
      setIsSimulatedSubmitted(false);
      onClose();
    }, 1200);
  };

  const isProfit = position.unrealizedPL >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSimulatedSubmitted}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSimulatedSubmitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="mb-3">
              <Completed3D size={48} />
            </div>
            <h3 className="text-base font-bold text-brand-text">
              Paper Sell Order Simulated
            </h3>
            <p className="text-xs text-brand-muted mt-1 max-w-xs">
              Simulated closing of {position.quantity} shares of {position.symbol} at ${position.currentPrice.toFixed(2)}. No real funds were affected.
            </p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Warning3D size={38} />
              <div>
                <h3 id="modal-title" className="text-base font-bold text-brand-text">
                  Confirm Paper Sell Order
                </h3>
                <p className="text-xs text-brand-muted">
                  Simulated closing position for {position.symbol}
                </p>
              </div>
            </div>

            {/* Position Details Card */}
            <div className="my-4 p-3.5 rounded-xl bg-brand-bg border border-brand-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-muted">Symbol:</span>
                <span className="font-bold text-brand-text">{position.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Quantity:</span>
                <span className="font-mono font-semibold text-brand-text">
                  {fmtQty(position.quantity)} shares
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Avg. Entry:</span>
                <span className="font-mono text-brand-text">
                  ${position.avgEntry.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Current Market Price:</span>
                <span className="font-mono font-bold text-brand-text">
                  ${position.currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-border/60">
                <span className="text-brand-muted">Estimated Unrealized P/L:</span>
                <span
                  className={`font-mono font-bold ${
                    isProfit ? 'text-brand-success' : 'text-brand-danger'
                  }`}
                >
                  {isProfit ? `+$${position.unrealizedPL.toFixed(2)}` : `-$${Math.abs(position.unrealizedPL).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Paper Trading Warning Notice */}
            <div className="p-3 rounded-xl bg-pink-50 border border-pink-200/60 text-[11px] text-brand-sidebar leading-relaxed mb-5">
              <span className="font-semibold block mb-0.5">Paper Trading Simulation</span>
              This order will only simulate closing the position in mock memory. No live Alpaca orders or real money trades will be executed.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar shadow-sm transition-colors"
              >
                Confirm Sell (Simulation)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

