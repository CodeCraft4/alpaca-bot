import React, { useMemo, useState } from 'react';
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
import { TrendingUp } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import { TrendingUp3D } from '../ui/icons3d';

type TimeFilter = '7D' | '30D' | '90D' | 'All';

interface Pt {
  ts: number;
  cum: number; // cumulative realized P/L
  trade: number | null; // P/L of the trade that closed at this point (null for baseline points)
}

const usd = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: Pt }> }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur border border-brand-border p-2.5 rounded-xl shadow-lg text-xs font-mono">
      <p className="text-brand-muted text-[10px] mb-1">
        {new Date(p.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>
      <div className="flex items-center gap-1.5 font-bold">
        <span className="text-brand-muted">Total so far:</span>
        <span className={p.cum >= 0 ? 'text-brand-success' : 'text-brand-danger'}>{usd(p.cum)}</span>
      </div>
      {p.trade !== null && (
        <div className="text-[10px] text-brand-muted mt-0.5">
          This trade: <span className={p.trade >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{usd(p.trade)}</span>
        </div>
      )}
    </div>
  );
};

export const ProfitLossChart: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<TimeFilter>('All');
  const { completedTrades } = useTradingContext();

  const data = useMemo<Pt[]>(() => {
    const days = selectedRange === '7D' ? 7 : selectedRange === '30D' ? 30 : selectedRange === '90D' ? 90 : Infinity;
    const cutoff = days === Infinity ? 0 : Date.now() - days * 86_400_000;
    const trades = [...completedTrades]
      .filter((t) => new Date(t.closedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());
    if (!trades.length) return [];

    const first = new Date(trades[0].closedAt).getTime();
    const now = Date.now();
    // baseline at 0 just before the first trade, one point per closed trade, and "now" so the line always extends
    const baseline = first - Math.max(30 * 60_000, (now - first) * 0.08);
    const pts: Pt[] = [{ ts: baseline, cum: 0, trade: null }];
    let cum = 0;
    for (const t of trades) {
      cum += t.realizedPL;
      pts.push({ ts: new Date(t.closedAt).getTime(), cum: Math.round(cum * 100) / 100, trade: t.realizedPL });
    }
    pts.push({ ts: Math.max(now, pts[pts.length - 1].ts + 60_000), cum: pts[pts.length - 1].cum, trade: null });
    return pts;
  }, [completedTrades, selectedRange]);

  const timeFilters: TimeFilter[] = ['7D', '30D', '90D', 'All'];
  const total = data.length ? data[data.length - 1].cum : 0;
  const up = total >= 0;
  const stroke = up ? '#16A34A' : '#DC2626';

  // Y axis fits the actual numbers (so a few cents are still visible)
  const [lo, hi] = useMemo(() => {
    const vals = [...data.map((d) => d.cum), 0];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max((max - min) * 0.25, 0.05);
    return [Math.floor((min - pad) * 100) / 100, Math.ceil((max + pad) * 100) / 100];
  }, [data]);

  const spanDays = data.length ? (data[data.length - 1].ts - data[0].ts) / 86_400_000 : 0;
  const tick = (v: number) =>
    new Date(v).toLocaleString([], spanDays < 2 ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brand-border shadow-card flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp3D size={26} />
            <h2 className="text-base font-bold text-brand-text">Profit &amp; Loss Performance</h2>
            <span className="text-[11px] font-semibold text-brand-primary">Realized</span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${up ? 'text-brand-success' : 'text-brand-danger'}`}>{usd(total)}</span>
            <span className="text-[11px] text-brand-muted hidden md:inline">
              {selectedRange === 'All' ? 'all time' : `in ${selectedRange}`} · {Math.max(0, data.length - 2)} closed trade{data.length - 2 === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border shrink-0 self-start sm:self-center">
          {timeFilters.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setSelectedRange(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                selectedRange === tf ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-white/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mt-4 relative">
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-muted">
            No closed trades in this period yet. The line appears after your first sell.
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="plGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FCE7F3" />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickCount={5}
              tickFormatter={tick}
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
              tickFormatter={(v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`}
              width={60}
              tickCount={5}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="stepAfter"
              dataKey="cum"
              stroke={stroke}
              strokeWidth={2.5}
              fill="url(#plGradient)"
              isAnimationActive={false}
              dot={(p: { cx?: number; cy?: number; payload?: Pt; index?: number }) =>
                p.payload && p.payload.trade !== null && p.cx !== undefined && p.cy !== undefined ? (
                  <circle key={`d-${p.index}`} cx={p.cx} cy={p.cy} r={4} fill={p.payload.trade >= 0 ? '#16A34A' : '#DC2626'} stroke="#fff" strokeWidth={2} />
                ) : (
                  <g key={`n-${p.index}`} />
                )
              }
              activeDot={{ r: 5, fill: stroke, stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-brand-muted pt-3 border-t border-brand-border/60 mt-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`w-3.5 h-3.5 ${up ? 'text-brand-success' : 'text-brand-danger'}`} />
          <span>Running total of realized profit &amp; loss (each dot = one closed trade)</span>
        </div>
        <span className="font-mono text-[11px]">Showing: {selectedRange}</span>
      </div>
    </div>
  );
};
