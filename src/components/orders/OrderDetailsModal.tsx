import React from 'react';
import { X, Info } from 'lucide-react';
import type { OrderItem } from '../../types/trading';
import { OrderStatusBadge, OrderSideBadge } from './OrderStatusBadge';
import { Badge3D } from '../ui/icons3d';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';
import { useTradingContext } from '../../context/TradingContext';

export interface OrderDetailsModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { currentPrice, settings, priceSource } = useTradingContext();
  if (!isOpen || !order) return null;

  const holding = order.status === 'Filled' && order.side === 'Buy' && (order.openQty ?? 0) > 1e-8;
  const fill = order.avgFillPrice ?? order.entryPrice;
  const openQty = order.openQty ?? 0;
  const unreal = order.unrealizedPL ?? 0;
  const realized = order.realizedPL ?? 0;
  const due = order.reviewDueAt ? new Date(order.reviewDueAt).getTime() : new Date(order.createdAt).getTime() + settings.holdingReviewDays * 86_400_000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
          <Badge3D size={38} />
          <div>
            <div className="flex items-center gap-2">
              <h3 id="order-details-title" className="text-base font-bold text-brand-text">
                Order Details
              </h3>
              <span className="font-mono text-xs font-semibold text-brand-muted">
                {order.id}
              </span>
            </div>
            <p className="text-xs text-brand-muted">Paper Trading Order Specification</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex items-center justify-between p-3 my-4 rounded-xl bg-brand-bg border border-brand-border">
          <div className="flex items-center gap-2">
            <OrderSideBadge side={order.side} />
            <span className="font-bold text-sm text-brand-text">{order.symbol}</span>
            <span className="text-xs text-brand-muted font-mono">({order.type})</span>
          </div>
          <OrderStatusBadge status={order.status} size="md" />
        </div>

        {/* Live profit / loss */}
        {order.status === 'Filled' && (
          <div className={`mb-3 p-3 rounded-xl border text-xs space-y-1.5 ${holding ? (unreal >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200') : 'bg-brand-bg border-brand-border'}`}>
            <p className="text-[10px] uppercase font-bold tracking-wide text-brand-primary">
              {holding ? `Live now (${priceSource === 'finnhub' ? 'Finnhub' : 'Alpaca'})` : order.side === 'Sell' ? 'Result of this sale' : 'Closed: all shares sold'}
            </p>
            {holding && (
              <>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Live price</span>
                  <span className="font-mono font-bold">{fmtUsd(currentPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Still holding</span>
                  <span className="font-mono font-bold">
                    {fmtQty(openQty)} sh · {fmtUsd(openQty * fill)} invested
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Profit / loss now</span>
                  <span className={`font-mono font-extrabold ${unreal >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {fmtSigned(unreal)}
                    {order.unrealizedPLPct != null && ` (${order.unrealizedPLPct >= 0 ? '+' : ''}${order.unrealizedPLPct.toFixed(2)}%)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Auto-sells at</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {fmtUsd(order.targetPrice)} (+{order.targetPct}%) → {fmtSigned(openQty * (order.targetPrice - fill))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Next review email</span>
                  <span className="font-mono">{new Date(due).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </>
            )}
            {(!holding || realized !== 0) && (
              <div className="flex justify-between">
                <span className="text-brand-muted">Realized profit / loss</span>
                <span className={`font-mono font-extrabold ${realized >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>{fmtSigned(realized)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-muted">Order value</span>
              <span className="font-mono">{fmtUsd(order.amountUsd ?? 0)}</span>
            </div>
          </div>
        )}

        {/* Specification Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Order Quantity
            </span>
            <span className="font-mono font-bold text-brand-text text-sm">
              {fmtQty(order.quantity)} shares
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Filled Quantity
            </span>
            <span className="font-mono font-bold text-brand-text text-sm">
              {fmtQty(order.filledQty)} shares
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Average Fill Price
            </span>
            <span className="font-mono font-bold text-brand-text text-sm">
              {order.avgFillPrice ? `$${order.avgFillPrice.toFixed(2)}` : '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Time In Force
            </span>
            <span className="font-mono font-bold text-brand-text text-sm">
              {order.timeInForce}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Profit Target ({order.targetPct}%)
            </span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              ${order.targetPrice.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Stop Loss ({order.stopLossPct}%)
            </span>
            <span className="font-mono font-bold text-red-700 text-sm">
              {order.stopLossPrice > 0 ? `$${order.stopLossPrice.toFixed(2)}` : 'None (manual)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-brand-border/80 col-span-2">
            <span className="text-[10px] text-brand-muted uppercase font-semibold block mb-0.5">
              Created Timestamp
            </span>
            <span className="font-mono text-brand-text text-xs">
              {order.formattedDate} • ({order.createdAt})
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-3 p-3 rounded-xl bg-pink-50/50 border border-brand-border text-xs">
            <span className="text-[10px] text-brand-primary uppercase font-bold block mb-1">
              Bot Strategy Notes
            </span>
            <p className="text-brand-text/90 leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Info Disclaimer */}
        <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center gap-2 text-[10px] text-brand-muted">
          <Info className="w-3.5 h-3.5 shrink-0 text-brand-muted" />
          <span>Alpaca Paper Trading sandbox record. Not linked to live market funds.</span>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

