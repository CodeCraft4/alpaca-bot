import React, { useState } from 'react';
import { Hourglass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTradingContext } from '../../context/TradingContext';
import { fmtQty, fmtUsd } from '../../lib/format';

/**
 * Orders that were accepted by Alpaca but are not filled yet (typically placed while the market is closed).
 * They are NOT positions yet, so without this card the Overview looks as if nothing happened.
 */
export const WaitingOrdersCard: React.FC = () => {
  const { orders, marketOpen, nextOpen, cancelOrder } = useTradingContext();
  const [cancelling, setCancelling] = useState(false);
  const waiting = orders.filter((o) => (o.status === 'Active' || o.status === 'Pending') && o.side === 'Buy');
  if (!waiting.length) return null;

  const total = waiting.reduce((a, o) => a + (o.amountUsd ?? 0), 0);
  const shares = waiting.reduce((a, o) => a + o.quantity, 0);
  const when = nextOpen
    ? new Date(nextOpen).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

  const cancelAll = async () => {
    setCancelling(true);
    try {
      await Promise.all(waiting.map((o) => cancelOrder(o.id)));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-amber-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-amber-50/60 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Hourglass className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-brand-text">
              Waiting orders <span className="text-brand-muted font-semibold">({waiting.length})</span>
            </h2>
            <p className="text-xs text-amber-900/80">
              {marketOpen
                ? 'Sent to Alpaca, waiting to be filled.'
                : `Market is closed. These are queued and will be bought when it opens${when ? ` (${when}, 9:30 AM ET)` : ''}.`}{' '}
              Open positions, P/L and the chart entry line appear once they fill.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-mono font-extrabold text-sm text-brand-text">{fmtUsd(total)}</div>
            <div className="text-brand-muted">≈ {fmtQty(shares)} shares in total</div>
          </div>
          <button
            type="button"
            onClick={() => void cancelAll()}
            disabled={cancelling}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 bg-white hover:bg-red-50 disabled:opacity-60"
          >
            {cancelling ? 'Cancelling…' : 'Cancel all'}
          </button>
          <Link to="/orders" className="text-xs font-semibold text-brand-primary hover:text-brand-sidebar">
            View orders →
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-brand-border/40 text-xs">
        {waiting.slice(0, 5).map((o) => (
          <li key={o.id} className="flex items-center justify-between px-5 sm:px-6 py-2.5">
            <span className="font-mono font-bold text-brand-text" title={o.id}>
              {o.id.slice(0, 8)}
            </span>
            <span className="font-mono text-brand-muted">
              BUY {o.type} · {fmtUsd(o.amountUsd ?? 0)}
            </span>
            <span className="font-mono text-emerald-700">
              target +{o.targetPct}% → {fmtUsd(o.targetPrice)}
            </span>
          </li>
        ))}
        {waiting.length > 5 && <li className="px-5 sm:px-6 py-2.5 text-brand-muted">+ {waiting.length - 5} more waiting orders</li>}
      </ul>
    </div>
  );
};
