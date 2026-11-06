import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Newspaper, RefreshCw, ShieldAlert, Target } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge3D } from '../ui/icons3d';
import { api } from '../../lib/api';
import { useTradingContext } from '../../context/TradingContext';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';

interface Probs { d1: number; d3: number; d5: number }
interface Analysis {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  confidence: number;
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
  summary: string;
  risks: string[];
  advice: string | null;
  provider: string;
  model: string | null;
  disclaimer: string;
  aiError?: string;
  createdAt: string;
  indicators: {
    rsi14: number | null;
    macdHist: number | null;
    bollingerPctB: number | null;
    atr14: number | null;
    volumeRatio: number | null;
    support: number;
    resistance: number;
    rangePos: number;
  };
  context: {
    news: { headline: string; source: string; datetime: string }[];
    earnings: { date: string; daysAway: number } | null;
    analysts: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  };
  position: {
    qty: number;
    avgEntry: number;
    price: number;
    targetPrice: number;
    stopPrice: number | null;
    plPct: number;
    needToTargetPct: number;
    heldDays: number;
    probabilities: { target: Probs | null; stop: Probs | null };
  } | null;
}

const ProbRow: React.FC<{ label: string; p: Probs | null; good: boolean }> = ({ label, p, good }) => (
  <div className="grid grid-cols-4 gap-1 items-center">
    <span className="text-brand-muted">{label}</span>
    {p ? (
      [p.d1, p.d3, p.d5].map((v, i) => (
        <span key={i} className={`font-mono font-bold text-right ${good ? 'text-emerald-700' : 'text-red-700'}`}>
          {v.toFixed(0)}%
        </span>
      ))
    ) : (
      <span className="col-span-3 text-right text-brand-muted">n/a</span>
    )}
  </div>
);

const Tile: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }> = ({ label, value, sub, tone }) => (
  <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-2.5 min-w-0">
    <div className="text-[10px] uppercase tracking-wide font-semibold text-brand-muted truncate">{label}</div>
    <div className={`text-sm font-bold font-mono mt-0.5 truncate ${tone ?? 'text-brand-text'}`}>{value}</div>
    {sub && <div className="text-[10px] text-brand-muted mt-0.5 leading-snug">{sub}</div>}
  </div>
);

const Section: React.FC<{ icon?: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="text-xs">
    <p className="font-semibold text-[11px] text-brand-primary uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
      {icon}
      {title}
    </p>
    {children}
  </div>
);

export const AIMarketAnalysisCard: React.FC = () => {
  const { openPositions, refreshNonce } = useTradingContext();
  const [a, setA] = useState<Analysis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasPosition = openPositions.length > 0;

  const load = async (refresh = false) => {
    setLoading(true);
    try {
      setA(await api<Analysis>(`/market/analysis${refresh ? '?refresh=true' : ''}`));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPosition]);

  useEffect(() => {
    if (refreshNonce > 0) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNonce]);

  // Position numbers are recomputed by the backend on each call; the AI text itself is cached for 15 min.
  useEffect(() => {
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, []);

  const color =
    a?.sentiment === 'Bullish' ? 'text-brand-success' : a?.sentiment === 'Bearish' ? 'text-brand-danger' : 'text-brand-muted';
  const donut = a
    ? [
        { name: 'Bullish', value: a.bullishPct, color: '#16A34A' },
        { name: 'Neutral', value: a.neutralPct, color: '#CBD5E1' },
        { name: 'Bearish', value: a.bearishPct, color: '#DC2626' },
      ]
    : [];
  const pos = a?.position;
  const an = a?.context.analysts;
  const anBuy = an ? an.strongBuy + an.buy : 0;
  const anSell = an ? an.sell + an.strongSell : 0;
  const anTotal = an ? anBuy + an.hold + anSell : 0;
  const ind = a?.indicators;
  const nearRes = ind ? ind.rangePos >= 85 : false;
  const nearSup = ind ? ind.rangePos <= 15 : false;

  return (
    // Same height as the chart card next to it (see OverviewPage); everything inside scrolls.
    <div className="bg-white rounded-2xl border border-brand-border shadow-card flex flex-col h-full max-h-[640px] lg:max-h-none overflow-hidden">
      {/* Header (fixed) */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-brand-border shrink-0">
        <div className="flex items-center gap-2.5">
          <Badge3D size={26} />
          <h2 className="text-base font-bold text-brand-text">AI Market Analysis</h2>
        </div>
        <div className="flex items-center gap-2">
          {a && <span className={`text-xs font-bold ${color}`}>{a.sentiment}</span>}
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-brand-muted hover:bg-pink-50 disabled:opacity-50"
            aria-label="Refresh analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scrollable body: most important things first */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4">
        {err && <p className="text-xs text-brand-danger">{err}</p>}
        {!a && !err && <p className="py-6 text-xs text-brand-muted text-center">Analysing ABNB…</p>}

        {a && (
          <>
            {a.aiError && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                AI model was unavailable, so this is an indicators-only analysis. Press refresh to retry.
              </div>
            )}

            {/* 1. Verdict */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} cx="50%" cy="50%" innerRadius={31} outerRadius={42} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {donut.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-brand-text font-mono leading-none">{a.confidence}%</span>
                  <span className="text-[8px] text-brand-muted uppercase font-semibold mt-0.5">Confidence</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {donut.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between font-medium mb-0.5">
                      <span className="flex items-center gap-1.5 text-brand-text">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-mono font-bold">{d.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Key facts at a glance */}
            <div className="grid grid-cols-2 gap-2">
              {pos ? (
                <Tile
                  label="Your position now"
                  value={`${pos.plPct >= 0 ? '+' : ''}${pos.plPct.toFixed(2)}%`}
                  tone={pos.plPct >= 0 ? 'text-brand-success' : 'text-brand-danger'}
                  sub={`${fmtSigned(pos.qty * (pos.price - pos.avgEntry))} · ${fmtQty(pos.qty)} sh · held ${pos.heldDays.toFixed(1)}d`}
                />
              ) : (
                <Tile label="Your position" value="None open" sub="No shares held right now" />
              )}
              {pos?.probabilities.target ? (
                <Tile
                  label="Target odds (3 days)"
                  value={`${pos.probabilities.target.d3.toFixed(0)}%`}
                  tone="text-emerald-700"
                  sub={`${fmtUsd(pos.targetPrice)} needs ${pos.needToTargetPct >= 0 ? '+' : ''}${pos.needToTargetPct.toFixed(2)}% · 1d ${pos.probabilities.target.d1.toFixed(0)}% · 5d ${pos.probabilities.target.d5.toFixed(0)}%`}
                />
              ) : (
                <Tile label="Target odds" value="n/a" sub="Open a position to see the odds" />
              )}
              {ind && (
                <Tile
                  label="Price vs key levels"
                  value={nearRes ? 'Near resistance' : nearSup ? 'Near support' : 'Mid-range'}
                  tone={nearRes ? 'text-amber-700' : nearSup ? 'text-emerald-700' : undefined}
                  sub={`Support ${fmtUsd(ind.support)} · Resistance ${fmtUsd(ind.resistance)}`}
                />
              )}
              <Tile
                label={a.context.earnings ? 'Next earnings' : 'Analyst view'}
                value={a.context.earnings ? `${a.context.earnings.daysAway} days` : an ? `${anBuy} buy` : 'n/a'}
                tone={a.context.earnings && a.context.earnings.daysAway <= 5 ? 'text-amber-700' : undefined}
                sub={
                  a.context.earnings
                    ? `${a.context.earnings.date}${an ? ` · analysts ${anBuy} buy / ${an.hold} hold / ${anSell} sell` : ''}`
                    : an
                      ? `${an.hold} hold · ${anSell} sell`
                      : undefined
                }
              />
            </div>

            {/* 3. What the model says */}
            <div className="p-3 rounded-xl bg-pink-50/70 border border-brand-border text-xs leading-relaxed">
              <p className="font-medium text-[11px] text-brand-primary mb-1 uppercase tracking-wide">
                {a.provider}
                {a.model ? ` / ${a.model}` : ''} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-brand-text/90">{a.summary}</p>
              {a.advice && <p className="mt-2 text-brand-text font-medium">{a.advice}</p>}
            </div>

            {/* 4. Position detail */}
            {pos && (
              <Section icon={<Target className="w-3.5 h-3.5" />} title="Your position in detail">
                <div className="p-3 rounded-xl bg-white border border-brand-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Entry → now</span>
                    <span className="font-mono font-semibold">
                      {fmtUsd(pos.avgEntry)} → {fmtUsd(pos.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Target</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {fmtUsd(pos.targetPrice)} <span className="font-normal">({fmtSigned(pos.qty * (pos.targetPrice - pos.avgEntry))})</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Stop-loss</span>
                    <span className="font-mono font-bold text-red-700">{pos.stopPrice ? fmtUsd(pos.stopPrice) : 'None (you decide)'}</span>
                  </div>
                  <div className="pt-1.5 border-t border-brand-border/60 space-y-1">
                    <div className="grid grid-cols-4 gap-1 text-[10px] uppercase tracking-wide text-brand-muted font-semibold">
                      <span>Chance to touch</span>
                      <span className="text-right">1 day</span>
                      <span className="text-right">3 days</span>
                      <span className="text-right">5 days</span>
                    </div>
                    <ProbRow label="Target" p={pos.probabilities.target} good />
                    {pos.stopPrice && <ProbRow label="Stop" p={pos.probabilities.stop} good={false} />}
                    <p className="text-[10px] text-brand-muted pt-0.5">Rough odds from recent volatility, not a forecast.</p>
                  </div>
                </div>
              </Section>
            )}

            {/* 5. Earnings warning */}
            {a.context.earnings && a.context.earnings.daysAway <= 5 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 text-xs">
                <CalendarClock className="w-4 h-4 shrink-0" />
                <span>
                  Earnings on <b>{a.context.earnings.date}</b>: expect a big price gap either way.
                </span>
              </div>
            )}

            {/* 6. Indicators */}
            {ind && (
              <Section title="Indicators">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ind.rsi14 != null && { k: 'RSI', v: ind.rsi14.toFixed(0), warn: ind.rsi14 > 70 || ind.rsi14 < 30 },
                    ind.macdHist != null && { k: 'MACD', v: ind.macdHist >= 0 ? 'positive' : 'negative', warn: false },
                    ind.bollingerPctB != null && { k: 'Bollinger', v: ind.bollingerPctB > 1 ? 'above band' : ind.bollingerPctB < 0 ? 'below band' : 'inside', warn: ind.bollingerPctB > 1 || ind.bollingerPctB < 0 },
                    ind.volumeRatio != null && { k: 'Volume', v: `${ind.volumeRatio.toFixed(1)}x`, warn: false },
                    ind.atr14 != null && { k: 'ATR', v: fmtUsd(ind.atr14), warn: false },
                  ]
                    .filter((c): c is { k: string; v: string; warn: boolean } => Boolean(c))
                    .map((c) => (
                      <span key={c.k} className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${c.warn ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-brand-bg border-brand-border text-brand-text'}`}>
                        {c.k}: {c.v}
                      </span>
                    ))}
                </div>
                <div className="relative h-1.5 mt-3 rounded-full bg-gradient-to-r from-red-200 via-gray-200 to-emerald-200">
                  <span
                    className="absolute -top-1 w-3 h-3 rounded-full bg-brand-primary border-2 border-white shadow"
                    style={{ left: `calc(${Math.min(100, Math.max(0, ind.rangePos))}% - 6px)` }}
                  />
                </div>
              </Section>
            )}

            {/* 7. Analysts */}
            {an && anTotal > 0 && (
              <Section title={`Analyst ratings (${anTotal})`}>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <span style={{ width: `${(anBuy / anTotal) * 100}%` }} className="bg-emerald-500" />
                  <span style={{ width: `${(an.hold / anTotal) * 100}%` }} className="bg-gray-300" />
                  <span style={{ width: `${(anSell / anTotal) * 100}%` }} className="bg-red-500" />
                </div>
                <div className="flex justify-between text-[10px] text-brand-muted mt-1">
                  <span>Buy {anBuy}</span>
                  <span>Hold {an.hold}</span>
                  <span>Sell {anSell}</span>
                </div>
              </Section>
            )}

            {/* 8. Risks */}
            {a.risks.length > 0 && (
              <Section icon={<ShieldAlert className="w-3.5 h-3.5" />} title="Key risks">
                <ul className="space-y-1 list-disc pl-4 text-brand-text/90">
                  {a.risks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 9. News */}
            {a.context.news.length > 0 && (
              <Section icon={<Newspaper className="w-3.5 h-3.5" />} title="Recent headlines">
                <ul className="space-y-1.5">
                  {a.context.news.slice(0, 5).map((n) => (
                    <li key={n.headline} className="leading-snug">
                      <span className="text-brand-text">{n.headline}</span>
                      <span className="text-brand-muted"> · {n.source}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <div className="pt-3 border-t border-brand-border/60 flex items-start gap-2 text-[10px] text-brand-muted leading-tight">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{a.disclaimer}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
