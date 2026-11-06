import { useTradingContext } from '../../context/TradingContext';
import React, { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import type { OrderItem } from '../../types/trading';
import { Target3D } from '../ui/icons3d';

export interface EditTargetsModalProps {
  order: OrderItem | null;
  /** When the change is applied to several open orders at once (Overview position row). */
  appliesTo?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    orderId: string,
    targetPct: number,
    targetPrice: number,
    stopLossPct: number,
    stopLossPrice: number
  ) => void;
}

interface EditTargetsFormProps {
  order: OrderItem;
  appliesTo?: number;
  onClose: () => void;
  onSave: (
    orderId: string,
    targetPct: number,
    targetPrice: number,
    stopLossPct: number,
    stopLossPrice: number
  ) => void;
}

const EditTargetsForm: React.FC<EditTargetsFormProps> = ({
  order,
  appliesTo,
  onClose,
  onSave,
}) => {
  const [targetPct, setTargetPct] = useState<number>(order.targetPct);
  const { currentPrice, settings } = useTradingContext();
  const stopLossPct = 0; // stop-loss is not used
  const [savedSuccess, setSavedSuccess] = useState(false);

  const entry = order.entryPrice;
  const isBuy = order.side === 'Buy';

  // Calculate estimated target and stop prices
  const estimatedTargetPrice = isBuy
    ? entry * (1 + (targetPct || 0) / 100)
    : entry * (1 - (targetPct || 0) / 100);

  const estimatedStopPrice = 0;
  const shares = order.openQty && order.openQty > 0 ? order.openQty : order.filledQty || order.quantity;
  const profitIfHit = shares * entry * ((targetPct || 0) / 100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      order.id,
      Number(targetPct),
      Number(estimatedTargetPrice.toFixed(2)),
      Number(stopLossPct),
      Number(estimatedStopPrice.toFixed(2))
    );
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        disabled={savedSuccess}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-50"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
        <Target3D size={38} />
        <div>
          <h3 id="edit-targets-title" className="text-base font-bold text-brand-text">
            Edit Targets & Safeguards
          </h3>
          <p className="text-xs text-brand-muted">
            {order.id} • {order.symbol} ({order.side})
          </p>
        </div>
      </div>

      {/* Current Entry Info */}
      <div className="my-4 p-3 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between text-xs">
        <span className="text-brand-muted">Reference Entry Price:</span>
        <span className="font-mono font-bold text-brand-text text-sm">
          ${entry.toFixed(2)}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Profit Target */}
        <div>
          <label className="block text-xs font-semibold text-brand-text mb-1">
            Profit Target (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={targetPct}
              onChange={(e) => setTargetPct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-mono font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-muted">
              %
            </span>
          </div>
          <div className="mt-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-muted">Live market price</span>
              <span className="font-mono font-bold text-brand-text">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">New target price</span>
              <span className="font-mono font-bold text-emerald-700">${estimatedTargetPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Price must rise by</span>
              <span className="font-mono text-brand-text">
                ${Math.max(0, estimatedTargetPrice - currentPrice).toFixed(2)}
                {currentPrice > 0 && ` (${(Math.max(0, (estimatedTargetPrice - currentPrice) / currentPrice) * 100).toFixed(2)}%)`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-200">
              <span className="text-brand-muted">Profit if hit ({shares.toFixed(4)} sh)</span>
              <span className="font-mono font-bold text-emerald-700">+${profitIfHit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {appliesTo && appliesTo > 1 && (
          <p className="text-[11px] font-semibold text-brand-primary">
            This new target is applied to all {appliesTo} open orders of this position.
          </p>
        )}

        {/* Disclaimer */}
        <div className="p-3 rounded-xl bg-pink-50/70 border border-brand-border text-[10px] text-brand-muted leading-tight flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-brand-primary mt-0.5" />
          <span>
            This order will be sold automatically when the live price reaches the new target. Other orders keep their own targets. The {settings.holdingReviewDays}-day review timer restarts.
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-brand-border">
          <button
            type="button"
            onClick={onClose}
            disabled={savedSuccess}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={savedSuccess}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar shadow-sm transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const EditTargetsModal: React.FC<EditTargetsModalProps> = ({
  order,
  appliesTo,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-targets-title"
    >
      <EditTargetsForm
        key={order.id}
        order={order}
        appliesTo={appliesTo}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
};
