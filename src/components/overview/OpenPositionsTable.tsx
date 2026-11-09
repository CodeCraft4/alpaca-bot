import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Sliders } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import type { OpenPosition, OrderItem } from '../../types/trading';
import { EditTargetsModal } from '../orders/EditTargetsModal';
import { Layers3D } from '../ui/icons3d';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';

const plColor = (n: number) => (n >= 0 ? 'text-brand-success' : 'text-brand-danger');

export const OpenPositionsTable: React.FC = () => {
  const { openPositions: polled, sellPosition, orders, editOrderTargets, currentPrice } = useTradingContext();
  // Re-price every position with the live stream price so profit/loss moves with each tick
  const openPositions = polled.map((p) => {
    const px = currentPrice > 0 ? currentPrice : p.currentPrice;
    return { ...p, currentPrice: px, marketValue: p.quantity * px, unrealizedPL: p.quantity * (px - p.avgEntry) };
  });
  const [editLots, setEditLots] = useState<OrderItem[] | null>(null);

  // The buy orders that still hold shares of a position (each has its own target)
  const lotsOf = (pos: OpenPosition) =>
    orders
      .filter((o) => o.status === 'Filled' && o.side === 'Buy' && o.symbol === pos.symbol && (o.openQty ?? 0) > 1e-6)
      .sort((a, b) => a.targetPrice - b.targetPrice);
  const [sellingId, setSellingId] = useState<string | null>(null);

  // One click = sell now (market order). No confirmation dialog.
  const handleSell = async (pos: OpenPosition) => {
    setSellingId(pos.id);
    try {
      await sellPosition(pos.id);
    } finally {
      setSellingId(null);
    }
  };

  // Per-row numbers use each position's own live price from the backend
  const rows = openPositions.map((p) => {
    const invested = p.quantity * p.avgEntry;
    const value = p.marketValue ?? p.quantity * p.currentPrice;
    const pl = p.unrealizedPL;
    const plPct = invested > 0 ? (pl / invested) * 100 : 0;
    const ifTarget = p.quantity * (p.targetPrice - p.avgEntry);
    const ifStop = p.stopLossPrice > 0 ? p.quantity * (p.stopLossPrice - p.avgEntry) : 0;
    return { p, invested, value, pl, plPct, ifTarget, ifStop };
  });
  const tot = rows.reduce(
    (a, r) => ({
      invested: a.invested + r.invested,
      value: a.value + r.value,
      pl: a.pl + r.pl,
      ifTarget: a.ifTarget + r.ifTarget,
      ifStop: a.ifStop + r.ifStop,
    }),
    { invested: 0, value: 0, pl: 0, ifTarget: 0, ifStop: 0 },
  );
  const totPct = tot.invested > 0 ? (tot.pl / tot.invested) * 100 : 0;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-brand-border/40">
          <div className="flex items-center gap-2.5">
            <Layers3D size={26} />
            <div>
              <h2 className="text-base font-bold text-brand-text">
                Open Positions <span className="text-brand-muted font-semibold">({openPositions.length})</span>
              </h2>
              <p className="text-xs text-brand-muted">Consolidated Alpaca portfolio positions across all active orders</p>
            </div>
          </div>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-sidebar transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border/40 text-brand-muted font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 sm:px-6">Symbol</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Avg. Entry</th>
                <th className="py-3 px-4">Current</th>
                <th className="py-3 px-4">Invested</th>
                <th className="py-3 px-4">Market Value</th>
                <th className="py-3 px-4">Profit / Loss</th>
                <th className="py-3 px-4">Target (profit)</th>
                <th className="py-3 px-4">Stop (loss)</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-brand-muted">
                    <p className="text-sm font-semibold text-brand-text">No open positions currently</p>
                    <p className="text-xs mt-1">Open a new position from the Orders page or New Order dialog.</p>
                  </td>
                </tr>
              ) : (
                rows.map(({ p: pos, invested, value, pl, plPct, ifTarget, ifStop }) => (
                  <tr key={pos.id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-brand-text">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-pink-100 text-brand-primary flex items-center justify-center font-bold text-[11px] shadow-sm">
                          {pos.symbol.substring(0, 2)}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-brand-text">{pos.symbol}</span>
                            {lotsOf(pos).length > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-brand-primary">
                                {lotsOf(pos).length} {lotsOf(pos).length === 1 ? 'order' : 'orders'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-brand-muted font-normal">Paper Stock · Consolidated</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-brand-text">{fmtQty(pos.quantity)}</td>
                    <td className="py-3.5 px-4 font-mono text-brand-muted">{fmtUsd(pos.avgEntry)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-text">{fmtUsd(pos.currentPrice)}</td>
                    <td className="py-3.5 px-4 font-mono text-brand-muted">{fmtUsd(invested)}</td>
                    <td className="py-3.5 px-4 font-mono text-brand-text">{fmtUsd(value)}</td>

                    {/* Live P/L ($ and %) */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`inline-flex items-center gap-1 font-bold ${plColor(pl)}`}>
                        {pl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {fmtSigned(pl)}
                      </span>
                      <span className={`block text-[10px] ${plColor(pl)}`}>
                        {plPct >= 0 ? '+' : ''}
                        {plPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Target: price and the profit if it is hit */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-emerald-600">{fmtUsd(pos.targetPrice)}</span>
                      <span className="block text-[10px] text-emerald-600">{fmtSigned(ifTarget)} if hit</span>
                    </td>

                    {/* Stop: price and the loss if it is hit */}
                    <td className="py-3.5 px-4 font-mono">
                      {pos.stopLossPrice > 0 ? (
                        <>
                          <span className="font-semibold text-brand-danger">{fmtUsd(pos.stopLossPrice)}</span>
                          <span className="block text-[10px] text-brand-danger">{fmtSigned(ifStop)} if hit</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-sans text-brand-muted">No stop (manual)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const lots = lotsOf(pos);
                          if (lots.length) setEditLots(lots);
                        }}
                        className="mr-1.5 p-1.5 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-pink-50 align-middle"
                        title="Edit target"
                        aria-label="Edit target"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSell(pos)}
                        disabled={sellingId === pos.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar transition-colors shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        {sellingId === pos.id ? 'Selling…' : 'Sell'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-brand-border bg-brand-bg/60 font-mono font-bold text-brand-text">
                  <td className="py-3 px-4 sm:px-6 font-sans text-[11px] uppercase tracking-wider text-brand-muted" colSpan={4}>
                    Total ({rows.length} open)
                  </td>
                  <td className="py-3 px-4">{fmtUsd(tot.invested)}</td>
                  <td className="py-3 px-4">{fmtUsd(tot.value)}</td>
                  <td className={`py-3 px-4 ${plColor(tot.pl)}`}>
                    {fmtSigned(tot.pl)}
                    <span className="block text-[10px]">
                      {totPct >= 0 ? '+' : ''}
                      {totPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-600">{fmtSigned(tot.ifTarget)}</td>
                  <td className="py-3 px-4 text-brand-muted">{rows.some((r) => r.p.stopLossPrice > 0) ? fmtSigned(tot.ifStop) : '—'}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <EditTargetsModal
        order={editLots?.[0] ?? null}
        appliesTo={editLots?.length}
        isOpen={Boolean(editLots)}
        onClose={() => setEditLots(null)}
        onSave={(_id, targetPct, targetPrice, stopLossPct, stopLossPrice) => {
          // The same new target for every open order of the position
          (editLots ?? []).forEach((l) => void editOrderTargets(l.id, targetPct, targetPrice, stopLossPct, stopLossPrice));
        }}
      />
    </>
  );
};
