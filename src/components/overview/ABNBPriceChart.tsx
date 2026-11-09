import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { Chart3D } from '../ui/icons3d';
import { api } from '../../lib/api';
import { useTradingContext } from '../../context/TradingContext';

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '1Y';

interface Bar {
  time: string;
  price: number;
  ma: number | null;
}
interface ChartPoint {
  ts: number;
  price: number;
  ma?: number;
}

const FIVE_MIN = 5 * 60_000;

const tickLabel = (ts: number, tf: TimeFrame) => {
  const d = new Date(ts);
  if (tf === '1D') return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (tf === '1W') return d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const fullLabel = (ts: number, tf: TimeFrame) =>
  new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    ...(tf === '1D' || tf === '1W' ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }),
  });

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  tf: TimeFrame;
}

const CustomTooltip: React.FC<TipProps> = ({ active, payload, tf }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur border border-brand-border p-2.5 rounded-xl shadow-lg text-xs font-mono">
      <p className="text-brand-muted text-[10px] mb-1">{fullLabel(p.ts, tf)}</p>
      <span className="text-brand-primary text-sm font-bold">${p.price.toFixed(2)}</span>
      {p.ma != null && (
        <p className="text-[10px] text-brand-muted mt-0.5">
          MA(7): <span className="text-pink-600 font-semibold">${p.ma.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
};

export const ABNBPriceChart: React.FC = () => {
  const { currentPrice, dailyChange, dailyChangePct, marketOpen, lastUpdated, priceSource, openPositions, orders, refreshNonce, lastTradeTs, alpacaPrice, streamLive } =
    useTradingContext();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const tradeAge = lastTradeTs ? Math.max(0, Math.round((now - lastTradeTs) / 1000)) : null;
  const ageText = tradeAge === null ? '' : tradeAge < 60 ? `${tradeAge}s ago` : `${Math.floor(tradeAge / 60)}m ago`;
  const lastTf = useRef<TimeFrame | null>(null);
  const [tf, setTf] = useState<TimeFrame>('1D');
  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEntries, setShowEntries] = useState(true);
  const [showTargets, setShowTargets] = useState(false);

  // Active buy orders holding shares
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'Filled' && o.side === 'Buy' && (o.openQty ?? 0) > 1e-8
    );
  }, [orders]);

  // Group active orders by entry price
  const activeEntries = useMemo(() => {
    const map = new Map<number, { price: number; qty: number; count: number; orderIds: string[] }>();
    for (const o of activeOrders) {
      const p = +( (o.avgFillPrice ?? o.entryPrice ?? 0).toFixed(2) );
      if (p <= 0) continue;
      const existing = map.get(p);
      if (existing) {
        existing.qty += o.openQty ?? 0;
        existing.count += 1;
        existing.orderIds.push(o.id.slice(0, 8));
      } else {
        map.set(p, {
          price: p,
          qty: o.openQty ?? 0,
          count: 1,
          orderIds: [o.id.slice(0, 8)],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.price - b.price);
  }, [activeOrders]);

  // Target prices for active orders
  const activeTargets = useMemo(() => {
    const map = new Map<number, { price: number; pct: number; count: number }>();
    for (const o of activeOrders) {
      const tp = +( (o.targetPrice ?? 0).toFixed(2) );
      if (tp <= 0) continue;
      const existing = map.get(tp);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(tp, {
          price: tp,
          pct: o.targetPct,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.price - b.price);
  }, [activeOrders]);

  const timeframes: TimeFrame[] = ['1D', '1W', '1M', '3M', '1Y'];

  // Load history for the selected timeframe, and refresh it while the day/week view is open
  useEffect(() => {
    let alive = true;
    const load = async (first: boolean) => {
      if (first) {
        setIsLoading(true);
        setBars([]);
      }
      try {
        const res = await api<{ bars: Bar[] }>(`/market/bars?timeframe=${tf}`);
        if (alive) {
          setBars(res.bars);
          setError(null);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive && first) setIsLoading(false);
      }
    };
    const tfChanged = lastTf.current !== tf; // a manual refresh keeps the current chart on screen
    lastTf.current = tf;
    void load(tfChanged);
    const every = tf === '1D' ? 30_000 : tf === '1W' ? 120_000 : 600_000;
    const t = setInterval(() => void load(false), every);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [tf, refreshNonce]);

  // History + the live price as the final point. History is never truncated.
  const data = useMemo<ChartPoint[]>(() => {
    const pts: ChartPoint[] = bars.map((b) => ({ ts: new Date(b.time).getTime(), price: b.price, ma: b.ma ?? undefined }));
    if (!pts.length || currentPrice <= 0 || tf === '3M' || tf === '1Y') return pts;
    const last = pts[pts.length - 1];
    const now = Date.now();
    if (now - last.ts < FIVE_MIN) {
      return [...pts.slice(0, -1), { ...last, price: currentPrice }];
    }
    return marketOpen ? [...pts, { ts: now, price: currentPrice }] : pts;
  }, [bars, currentPrice, tf, marketOpen]);

  const prevClose = currentPrice - dailyChange;
  const entry = openPositions[0]?.avgEntry;

  const [lo, hi] = useMemo(() => {
    if (!data.length) return [0, 1];
    const vals = data.map((d) => d.price);
    if ((tf === '1D' || tf === '1W') && prevClose > 0) vals.push(prevClose);
    if (showEntries && (tf === '1D' || tf === '1W')) {
      activeEntries.forEach((e) => vals.push(e.price));
      if (activeEntries.length === 0 && entry) vals.push(entry);
    }
    if (showTargets && (tf === '1D' || tf === '1W')) {
      activeTargets.forEach((t) => vals.push(t.price));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max((max - min) * 0.12, 0.25);
    return [Math.floor((min - pad) * 100) / 100, Math.ceil((max + pad) * 100) / 100];
  }, [data, tf, prevClose, showEntries, showTargets, activeEntries, activeTargets, entry]);

  const isProfit = dailyChange >= 0;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brand-border shadow-card flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2.5">
            <Chart3D size={26} />
            <h2 className="text-base font-bold text-brand-text">ABNB Live Market Overview</h2>
            <StatusBadge label={marketOpen ? 'Market Open' : 'Market Closed'} variant={marketOpen ? 'success' : 'warning'} size="sm" dot />
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-text font-mono transition-all">
              ${currentPrice.toFixed(2)}
            </span>
            <span className={`inline-flex items-center text-xs sm:text-sm font-semibold ${isProfit ? 'text-brand-success' : 'text-brand-danger'}`}>
              {isProfit ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {isProfit ? '+' : '-'}${Math.abs(dailyChange).toFixed(2)} ({isProfit ? '+' : ''}
              {dailyChangePct.toFixed(2)}%)
            </span>
            <span className="text-[11px] text-brand-muted hidden md:inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${streamLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {priceSource === 'finnhub' ? 'Finnhub' : 'Alpaca IEX'}
              {tradeAge !== null && <span className="font-mono"> · last trade {ageText}</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 self-start sm:self-center">
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowEntries((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showEntries
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                    : 'bg-white text-brand-muted border-brand-border hover:bg-gray-50'
                }`}
                title="Toggle active order entry lines on chart"
              >
                Entries ({activeOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setShowTargets((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showTargets
                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm'
                    : 'bg-white text-brand-muted border-brand-border hover:bg-gray-50'
                }`}
                title="Toggle profit target lines on chart"
              >
                Targets
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border">
            {timeframes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTf(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  tf === t ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mt-5 relative">
        {isLoading && data.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-10">
            <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mb-2" />
            <span className="text-xs font-semibold text-brand-muted">Loading chart…</span>
          </div>
        )}
        {error && data.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-danger">{error}</div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="abnbPinkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DB2777" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#BE185D" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#BE185D" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FCE7F3" />

            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickCount={6}
              tickFormatter={(v: number) => tickLabel(v, tf)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#827581', fontSize: 11 }}
              dy={8}
              minTickGap={40}
            />

            <YAxis
              domain={[lo, hi]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#827581', fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              width={62}
              tickCount={6}
            />

            <Tooltip content={<CustomTooltip tf={tf} />} />

            {/* Previous Close Reference Line */}
            {tf === '1D' && prevClose > 0 && (
              <ReferenceLine y={prevClose} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: `Prev close $${prevClose.toFixed(2)}`, position: 'insideBottomLeft', fill: '#6B7280', fontSize: 10 }} />
            )}

            {/* Active Order Entries */}
            {showEntries && (tf === '1D' || tf === '1W') && activeEntries.length > 0 &&
              activeEntries.map((e, idx) => (
                <ReferenceLine
                  key={`entry-${e.price}-${idx}`}
                  y={e.price}
                  stroke="#16A34A"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value:
                      activeEntries.length === 1
                        ? `Entry $${e.price.toFixed(2)} (${e.qty.toFixed(4)} sh)`
                        : `Entry #${idx + 1}: $${e.price.toFixed(2)} (${e.count > 1 ? `${e.count} orders · ` : ''}${e.qty.toFixed(4)} sh)`,
                    position: idx % 2 === 0 ? 'insideTopLeft' : 'insideBottomLeft',
                    fill: '#15803D',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              ))}

            {/* Fallback to single consolidated entry */}
            {showEntries && (tf === '1D' || tf === '1W') && activeEntries.length === 0 && entry && (
              <ReferenceLine y={entry} stroke="#16A34A" strokeDasharray="2 3" label={{ value: `Your entry $${entry.toFixed(2)}`, position: 'insideTopLeft', fill: '#15803D', fontSize: 10 }} />
            )}

            {/* Active Order Targets */}
            {showTargets && (tf === '1D' || tf === '1W') &&
              activeTargets.map((t, idx) => (
                <ReferenceLine
                  key={`target-${t.price}-${idx}`}
                  y={t.price}
                  stroke="#8B5CF6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target: $${t.price.toFixed(2)} (+${t.pct}%)`,
                    position: idx % 2 === 0 ? 'insideTopRight' : 'insideBottomRight',
                    fill: '#7C3AED',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              ))}

            <Area
              type="monotone"
              dataKey="price"
              stroke="#DB2777"
              strokeWidth={2.25}
              fill="url(#abnbPinkGradient)"
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 5, fill: '#DB2777', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-brand-muted pt-3 border-t border-brand-border/60 mt-2 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-primary" />
            <span>
              {streamLive ? 'Live stream' : 'Polling'}: Finnhub ${currentPrice.toFixed(2)}
              {alpacaPrice != null && (
                <>
                  {' '}· Alpaca IEX ${alpacaPrice.toFixed(2)}{' '}
                  <span className="font-mono">({alpacaPrice - currentPrice >= 0 ? '+' : '-'}${Math.abs(alpacaPrice - currentPrice).toFixed(2)})</span>
                </>
              )}
            </span>
          </div>

          {activeEntries.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <span className="w-2 h-0.5 bg-emerald-600 inline-block rounded-full" />
              <span>{activeOrders.length} active order {activeOrders.length === 1 ? 'entry' : 'entries'} on chart</span>
            </div>
          )}
        </div>
        <span className="font-mono text-[11px]">Updated: {lastUpdated}</span>
      </div>
    </div>
  );
};
