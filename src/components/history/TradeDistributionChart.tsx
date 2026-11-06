import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { CompletedTrade } from '../../types/trading';
import { Chart3D } from '../ui/icons3d';

export interface TradeDistributionChartProps {
  trades: CompletedTrade[];
}

export const TradeDistributionChart: React.FC<TradeDistributionChartProps> = ({ trades }) => {
  const total = trades.length;
  const wins = trades.filter((t) => t.realizedPL > 0).length;
  const losses = trades.filter((t) => t.realizedPL <= 0).length;

  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  const lossPct = total > 0 ? ((losses / total) * 100).toFixed(1) : '0';

  const data = [
    { name: 'Winning Trades', value: wins, color: '#16A34A' },
    { name: 'Losing Trades', value: losses, color: '#DC2626' },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brand-border shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <Chart3D size={26} />
            <h2 className="text-base font-bold text-brand-text">Trade Distribution</h2>
          </div>
          <span className="text-xs font-semibold text-brand-muted">
            {total} Total
          </span>
        </div>

        {/* Donut Chart & Breakdown */}
        <div className="flex items-center justify-between gap-4 my-5">
          {/* Circular Donut */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={54}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-brand-text font-mono">
                {winPct}%
              </span>
              <span className="text-[9px] text-brand-muted uppercase font-semibold">
                Win Rate
              </span>
            </div>
          </div>

          {/* Legend and Numbers */}
          <div className="flex-1 space-y-2">
            <div className="py-1 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-brand-text">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Winning Trades
              </span>
              <span className="font-mono text-emerald-600 font-bold">{wins} ({winPct}%)</span>
            </div>

            <div className="py-1 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-brand-text">
                <XCircle className="w-4 h-4 text-brand-danger" />
                Losing Trades
              </span>
              <span className="font-mono text-brand-danger font-bold">{losses} ({lossPct}%)</span>
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-brand-muted font-mono">
            <span>Wins: {wins}</span>
            <span>Losses: {losses}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${winPct}%` }}
            />
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${lossPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legal & Informational Disclaimer */}
      <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-start gap-2 text-[10px] text-brand-muted leading-tight">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-brand-muted mt-0.5" />
        <span>Based on your completed trades. Past performance is not a guarantee of future results.</span>
      </div>
    </div>
  );
};

