import React from 'react';
import type { CompletedTrade } from '../../types/trading';
import { History3D, Completed3D, TrendingDown3D, Cash3D } from '../ui/icons3d';

export interface TradeStatsCardsProps {
  trades: CompletedTrade[];
}

export const TradeStatsCards: React.FC<TradeStatsCardsProps> = ({ trades }) => {
  const total = trades.length;
  const wins = trades.filter((t) => t.realizedPL > 0).length;
  const losses = trades.filter((t) => t.realizedPL <= 0).length;
  const netPL = trades.reduce((acc, t) => acc + t.realizedPL, 0);
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

  const isNetProfit = netPL >= 0;
  const invested = trades.reduce((acc, t) => acc + t.investment, 0);
  const netPct = invested > 0 ? (netPL / invested) * 100 : 0;

  const stats = [
    {
      label: 'Completed Trades',
      value: total.toString(),
      subtext: `Win Rate: ${winRate}%`,
      icon3d: <History3D size={36} />,
    },
    {
      label: 'Profitable Trades',
      value: wins.toString(),
      change: `${winRate}%`,
      isPositive: true,
      subtext: 'Sold at a profit',
      icon3d: <Completed3D size={36} />,
    },
    {
      label: 'Loss-Making Trades',
      value: losses.toString(),
      change: `${(100 - parseFloat(winRate)).toFixed(1)}%`,
      isPositive: false,
      subtext: 'Sold at a loss (or break-even)',
      icon3d: <TrendingDown3D size={36} />,
    },
    {
      label: 'Net Realized P/L',
      value: `${isNetProfit ? '+' : '-'}$${Math.abs(netPL).toFixed(2)}`,
      change: `${netPct >= 0 ? '+' : ''}${netPct.toFixed(2)}%`,
      isPositive: isNetProfit,
      subtext: 'Return on money invested in closed trades',
      icon3d: <Cash3D size={36} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white p-5 rounded-2xl border border-brand-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted tracking-wide">
              {stat.label}
            </span>
            <div className="p-1 rounded-2xl bg-gradient-to-br from-pink-50/80 via-transparent to-pink-100/50 dark:from-pink-950/40 dark:to-pink-900/20 border border-brand-border/70 shadow-sm group-hover:scale-105 transition-transform duration-200">
              {stat.icon3d}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold text-brand-text font-mono tracking-tight">
                {stat.value}
              </span>
              {stat.change && (
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    stat.isPositive ? 'text-brand-success' : 'text-brand-danger'
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-muted mt-1 font-normal">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
