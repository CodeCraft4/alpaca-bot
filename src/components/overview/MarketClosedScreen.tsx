import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketClosed3D, Calendar3D, Wallet3D, Layers3D, Chart3D } from '../ui/icons3d';
import { useTradingContext } from '../../context/TradingContext';
import { fmtQty, fmtUsd } from '../../lib/format';

const pad = (n: number) => String(n).padStart(2, '0');

/** Shown instead of the dashboard whenever the US market is closed (weekends, nights, holidays). */
export const MarketClosedScreen: React.FC = () => {
  const { nextOpen, equity, openPositions, orders } = useTradingContext();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = nextOpen ? new Date(nextOpen).getTime() : 0;
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);

  const weekday = new Date(now).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
  const reason = weekday === 'Saturday' || weekday === 'Sunday' ? `It is ${weekday}: the US market is closed for the weekend.` : 'The US market is closed right now (outside 9:30 AM to 4:00 PM ET, or a holiday).';
  const opensLocal = target
    ? new Date(target).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

  const held = openPositions.reduce((a, p) => a + p.quantity, 0);
  const waiting = orders.filter((o) => o.status === 'Active' || o.status === 'Pending').length;

  return (
    <div className="space-y-4">
      {/* Compact status strip (nothing here can be acted on) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Wallet3D size={22} />, label: 'Account equity', value: fmtUsd(equity) },
          { icon: <Layers3D size={22} />, label: 'Open positions', value: `${openPositions.length}${held > 0 ? ` · ${fmtQty(held)} sh` : ''}` },
          { icon: <Calendar3D size={22} />, label: 'Waiting orders', value: String(waiting) },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-brand-border shadow-card px-3 py-1.5 min-h-[34px] flex items-center gap-2.5">
            {c.icon}
            <span className="text-[11px] uppercase font-semibold text-brand-muted">{c.label}</span>
            <span className="ml-auto font-mono font-extrabold text-sm text-brand-text">{c.value}</span>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50 px-6 py-[25px] sm:py-[41px] text-center shadow-card">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-200/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-red-200/40 blur-3xl" aria-hidden />

        <div className="relative flex flex-col items-center">
          <MarketClosed3D size={150} />
          <h2 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-red-600 uppercase">Market Closed</h2>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-red-900/80">{reason}</p>
          <p className="mt-1 text-sm font-semibold text-red-700">Trading is disabled: new orders and selling are paused until the market opens.</p>

          {target > 0 && (
            <div className="mt-8 w-full max-w-xl rounded-2xl border border-red-200 bg-white/80 backdrop-blur px-5 py-4">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
                <Calendar3D size={22} /> Market opens in
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3 font-mono">
                {[
                  { v: d, l: 'days' },
                  { v: h, l: 'hours' },
                  { v: m, l: 'min' },
                  { v: s, l: 'sec' },
                ].map((x) => (
                  <div key={x.l} className="min-w-[64px] rounded-xl bg-red-600 text-white px-3 py-2 shadow">
                    <div className="text-2xl sm:text-3xl font-extrabold leading-none">{pad(x.v)}</div>
                    <div className="text-[10px] uppercase tracking-wide opacity-80 mt-1">{x.l}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Next open: <span className="font-semibold text-brand-text">{opensLocal}</span> (your time) · 9:30 AM New York
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/orders" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-sidebar shadow-sm">
              <Layers3D size={20} /> Orders &amp; history
            </Link>
            <Link to="/history" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-brand-border text-brand-text hover:border-pink-300 shadow-sm">
              <Chart3D size={20} /> Trade history
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
