import React from 'react';
import { Layers, ShoppingCart, Banknote, Hourglass } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';

/** Plain-language answer to: what did I buy, what did I sell, and what do I still hold? */
export const HoldingsSummary: React.FC = () => {
  const { orders, openPositions } = useTradingContext();

  const filled = orders.filter((o) => o.status === 'Filled');
  const buys = filled.filter((o) => o.side === 'Buy');
  const sells = filled.filter((o) => o.side === 'Sell');
  const waiting = orders.filter((o) => o.status === 'Active' || o.status === 'Pending');
  const usd = (list: typeof filled) => list.reduce((a, o) => a + (o.amountUsd ?? 0), 0);
  const shares = (list: typeof filled) => list.reduce((a, o) => a + o.filledQty, 0);

  const heldShares = openPositions.reduce((a, p) => a + p.quantity, 0);
  const invested = openPositions.reduce((a, p) => a + p.quantity * p.avgEntry, 0);
  const pl = openPositions.reduce((a, p) => a + p.unrealizedPL, 0);

  const Box: React.FC<{ icon: React.ReactNode; title: string; big: string; lines: string[]; tone?: string }> = ({ icon, title, big, lines, tone }) => (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-brand-muted text-[11px] font-semibold uppercase tracking-wide">
        {icon}
        {title}
      </div>
      <div className={`text-xl font-extrabold font-mono ${tone ?? 'text-brand-text'}`}>{big}</div>
      {lines.map((l) => (
        <div key={l} className="text-[11px] text-brand-muted leading-snug">
          {l}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Box
          icon={<ShoppingCart className="w-3.5 h-3.5" />}
          title="Bought"
          big={fmtUsd(usd(buys))}
          lines={[`${buys.length} buy order${buys.length === 1 ? '' : 's'} · ${fmtQty(shares(buys))} shares in total`]}
        />
        <Box
          icon={<Banknote className="w-3.5 h-3.5" />}
          title="Sold"
          big={fmtUsd(usd(sells))}
          lines={[`${sells.length} sell order${sells.length === 1 ? '' : 's'} · ${fmtQty(shares(sells))} shares in total`]}
        />
        <Box
          icon={<Layers className="w-3.5 h-3.5" />}
          title="Still holding now"
          big={`${fmtQty(heldShares)} sh`}
          tone={openPositions.length ? 'text-brand-primary' : undefined}
          lines={[
            openPositions.length
              ? `${openPositions.length} open position · invested ${fmtUsd(invested)} · P/L ${fmtSigned(pl)}`
              : 'Nothing open: everything bought has been sold',
          ]}
        />
        <Box
          icon={<Hourglass className="w-3.5 h-3.5" />}
          title="Waiting orders"
          big={String(waiting.length)}
          lines={[
            waiting.length
              ? `${fmtUsd(waiting.reduce((a, o) => a + (o.amountUsd ?? 0), 0))} not yet filled`
              : 'No order is waiting in the market',
          ]}
        />
      </div>
      <p className="text-[11px] text-brand-muted px-1 leading-relaxed">
        <b className="text-brand-text">How to read this:</b> an <i>order</i> is one instruction (buy or sell). A <i>position</i> is what you
        still own. You placed {buys.length} buy and {sells.length} sell order{sells.length === 1 ? '' : 's'}; bought shares minus sold shares ={' '}
        {fmtQty(Math.max(0, shares(buys) - shares(sells)))} shares, which is your open position.
      </p>
    </div>
  );
};
