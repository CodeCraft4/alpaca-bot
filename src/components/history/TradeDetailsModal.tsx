import React from 'react';
import { X, ArrowRight, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from 'lucide-react';
import type { CompletedTrade } from '../../types/trading';
import { Badge3D } from '../ui/icons3d';
import { fmtQty } from '../../lib/format';

export interface TradeDetailsModalProps {
  trade: CompletedTrade | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  trade,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !trade) return null;

  const isProfit = trade.realizedPL >= 0;
  const priceDiff = trade.exitPrice - trade.entryPrice;

  const getExitReasonClass = (reason: string) => {
    switch (reason) {
      case 'Profit Target':
        return 'text-emerald-600 font-semibold';
      case 'Stop Loss':
        return 'text-brand-danger font-semibold';
      case 'Manual Sell':
        return 'text-brand-primary font-semibold';
      default:
        return 'text-brand-muted font-medium';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-details-title"
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
        <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
          <Badge3D size={38} />
          <div>
            <div className="flex items-center gap-2">
              <h3 id="trade-details-title" className="text-base font-bold text-brand-text">
                Trade Execution Record
              </h3>
              <span className="font-mono text-xs font-semibold text-brand-muted">
                <span title={trade.id}>{trade.id.slice(0, 8)}</span>
              </span>
            </div>
            <p className="text-xs text-brand-muted">ABNB Algorithmic Paper Trade Receipt</p>
          </div>
        </div>

        {/* Trade Highlight Summary Banner */}
        <div className="p-3.5 my-4 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-primary">
                {trade.side.toUpperCase()}
              </span>
              <span className="font-bold text-sm text-brand-text">{trade.symbol}</span>
              <span className="text-[11px] font-medium text-brand-muted">
                Closed
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Held for {trade.holdingDuration}</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-base font-extrabold font-mono ${
                isProfit ? 'text-brand-success' : 'text-brand-danger'
              }`}
            >
              {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {isProfit ? `+$${trade.realizedPL.toFixed(2)}` : `-$${Math.abs(trade.realizedPL).toFixed(2)}`}
            </span>
            <span
              className={`block text-xs font-mono font-semibold ${
                isProfit ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {isProfit ? `+${trade.returnPct.toFixed(2)}%` : `${trade.returnPct.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Visual Price Comparison Bar */}
        <div className="p-3 rounded-xl bg-white border border-brand-border mb-4">
          <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block mb-2">
            Execution Price Comparison
          </span>
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-pink-50/40 border border-pink-100">
            <div>
              <span className="text-[10px] text-brand-muted block">Entry Price</span>
              <span className="text-sm font-bold text-brand-text font-mono">
                ${trade.entryPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-brand-primary" />
              <span
                className={`text-[10px] font-mono font-semibold mt-0.5 ${
                  isProfit ? 'text-brand-success' : 'text-brand-danger'
                }`}
              >
                {priceDiff >= 0 ? `+$${priceDiff.toFixed(2)}` : `-$${Math.abs(priceDiff).toFixed(2)}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-brand-muted block">Exit Price</span>
              <span className="text-sm font-bold text-brand-text font-mono">
                ${trade.exitPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Entry Section */}
          <div className="p-3 rounded-xl bg-white border border-brand-border">
            <span className="text-[10px] text-brand-primary uppercase font-bold block mb-1">
              Entry Details
            </span>
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-brand-muted">Shares:</span>
                <span className="font-mono font-semibold text-brand-text">{fmtQty(trade.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Avg Fill:</span>
                <span className="font-mono text-brand-text">${trade.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border/60 pt-1">
                <span className="text-brand-muted">Investment:</span>
                <span className="font-mono font-bold text-brand-text">${trade.investment.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Exit Section */}
          <div className="p-3 rounded-xl bg-white border border-brand-border">
            <span className="text-[10px] text-brand-primary uppercase font-bold block mb-1">
              Exit Details
            </span>
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-brand-muted">Shares:</span>
                <span className="font-mono font-semibold text-brand-text">{fmtQty(trade.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Exit Reason:</span>
                <span className={`text-[11px] font-semibold ${getExitReasonClass(trade.exitReason)}`}>
                  {trade.exitReason}
                </span>
              </div>
              <div className="flex justify-between border-t border-brand-border/60 pt-1">
                <span className="text-brand-muted">Exit Value:</span>
                <span className="font-mono font-bold text-brand-text">${trade.exitValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="p-3 rounded-xl bg-white border border-brand-border col-span-2 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-muted">Entry Time:</span>
              <span className="font-mono text-brand-text">{trade.enteredAt.replace('T', ' ').replace('Z', ' UTC')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Closed Time:</span>
              <span className="font-mono text-brand-text">{trade.closedAt.replace('T', ' ').replace('Z', ' UTC')}</span>
            </div>
          </div>
        </div>

        {/* Bot Notes */}
        {trade.notes && (
          <div className="mt-3 p-3 rounded-xl bg-pink-50/50 border border-brand-border text-xs">
            <span className="text-[10px] text-brand-primary uppercase font-bold block mb-1">
              Execution Commentary
            </span>
            <p className="text-brand-text/90 leading-relaxed text-[11px]">{trade.notes}</p>
          </div>
        )}

        {/* Paper Footer */}
        <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-[10px] text-brand-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
            <span>Alpaca Paper Trade Simulation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

