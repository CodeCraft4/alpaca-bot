import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Eye, Sliders } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import type { OrderItem } from '../../types/trading';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';

export interface LiveOpenOrdersProps {
  onViewDetails: (o: OrderItem) => void;
  onEditTargets: (o: OrderItem) => void;
}

/** Every buy order that still holds shares, with its live profit / loss. */
export const LiveOpenOrders: React.FC<LiveOpenOrdersProps> = ({ onViewDetails, onEditTargets }) => {
  const { orders, currentPrice, settings, sellOrder, priceSource } = useTradingContext();
  const open = orders.filter((o) => o.status === 'Filled' && o.side === 'Buy' && (o.openQty ?? 0) > 1e-8);

  const rows = open.map((o) => {
    const qty = o.openQty ?? 0;
    const fill = o.avgFillPrice ?? o.entryPrice;
    const invested = qty * fill;
    // live: recomputed from the streaming price on every tick
    const pl = currentPrice > 0 ? qty * (currentPrice - fill) : (o.unrealizedPL ?? 0);
    const plPct = currentPrice > 0 && fill ? ((currentPrice - fill) / fill) * 100 : (o.unrealizedPLPct ?? 0);
    const ifHit = qty * (o.targetPrice - fill);
    const due = o.reviewDueAt ? new Date(o.reviewDueAt).getTime() : new Date(o.createdAt).getTime() + settings.holdingReviewDays * 86_400_000;
    const ms = due - Date.now();
    const review = ms <= 0 ? 'due now' : ms >= 86_400_000 ? `${Math.floor(ms / 86_400_000)}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h` : `${Math.max(1, Math.floor(ms / 3_600_000))}h`;
    return { o, qty, fill, invested, pl, plPct, ifHit, review };
  });
  const totPl = rows.reduce((a, r) => a + r.pl, 0);
  const totInv = rows.reduce((a, r) => a + r.invested, 0);

  const [sellingId, setSellingId] = useState<string | null>(null);

  // One click = sell this order's shares now (market order). No confirmation.
  const handleSell = async (r: (typeof rows)[number]) => {
    setSellingId(r.o.id);
    try {
      await sellOrder(r.o.id, r.qty);
    } finally {
      setSellingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-brand-border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-6 py-4 border-b border-brand-border/60">
        <div>
          <h2 className="text-base font-bold text-brand-text">
            Live open orders <span className="text-brand-muted font-semibold">({rows.length})</span>
          </h2>
          <p className="text-xs text-brand-muted">
            Orders that still hold shares. Each one sells automatically at its own target. Live price ${currentPrice.toFixed(2)} ({priceSource === 'finnhub' ? 'Finnhub' : 'Alpaca'}).
          </p>
        </div>
        {rows.length > 0 && (
          <div className="text-right text-xs">
            <div className="text-brand-muted">Total now</div>
            <div className={`font-mono font-extrabold text-sm ${totPl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
              {fmtSigned(totPl)} <span className="text-[10px] font-semibold">on {fmtUsd(totInv)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-brand-border/40 text-brand-muted font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 sm:px-6">Order</th>
              <th className="py-3 px-4">Shares</th>
              <th className="py-3 px-4">Amount ($)</th>
              <th className="py-3 px-4">Bought at</th>
              <th className="py-3 px-4">Live price</th>
              <th className="py-3 px-4">Live profit / loss</th>
              <th className="py-3 px-4">Target (profit)</th>
              <th className="py-3 px-4">Review in</th>
              <th className="py-3 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-brand-muted">
                  No order is holding shares right now.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.o.id} className="hover:bg-pink-50/30 transition-colors">
                  <td className="py-3 px-4 sm:px-6 font-mono font-bold text-brand-text" title={r.o.id}>
                    {r.o.id.slice(0, 8)}
                    <span className="block text-[10px] font-normal text-brand-muted">{r.o.formattedDate}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">{fmtQty(r.qty)}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{fmtUsd(r.invested)}</td>
                  <td className="py-3 px-4 font-mono text-brand-muted">{fmtUsd(r.fill)}</td>
                  <td className="py-3 px-4 font-mono font-bold">{fmtUsd(currentPrice)}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className={`inline-flex items-center gap-1 font-bold ${r.pl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {r.pl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {fmtSigned(r.pl)}
                    </span>
                    <span className={`block text-[10px] ${r.pl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {r.plPct >= 0 ? '+' : ''}
                      {r.plPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="font-semibold text-emerald-600">{fmtUsd(r.o.targetPrice)}</span>
                    <span className="block text-[10px] text-emerald-600">
                      +{r.o.targetPct}% · {fmtSigned(r.ifHit)} if hit
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-brand-muted whitespace-nowrap">{r.review}</td>
                  <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onViewDetails(r.o)} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-pink-50" title="Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onEditTargets(r.o)} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-pink-50" title="Change target">
                        <Sliders className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSell(r)}
                        disabled={sellingId === r.o.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar transition-colors shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        {sellingId === r.o.id ? 'Selling…' : 'Sell'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
