import React from 'react';
import { Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { CompletedTrade, ExitReason } from '../../types/trading';
import { fmtQty } from '../../lib/format';

export interface CompletedTradesTableProps {
  trades: CompletedTrade[];
  onViewDetails: (trade: CompletedTrade) => void;
}

export const CompletedTradesTable: React.FC<CompletedTradesTableProps> = ({
  trades,
  onViewDetails,
}) => {
  const getExitReasonClass = (reason: ExitReason) => {
    switch (reason) {
      case 'Profit Target':
        return 'text-emerald-600 font-semibold';
      case 'Stop Loss':
        return 'text-brand-danger font-semibold';
      case 'Manual Sell':
        return 'text-brand-primary font-semibold';
      default:
        return 'text-brand-muted font-medium';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-brand-border/40 text-brand-muted font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4 sm:px-6">Trade ID</th>
              <th className="py-3.5 px-4">Symbol</th>
              <th className="py-3.5 px-4">Side</th>
              <th className="py-3.5 px-4">Quantity</th>
              <th className="py-3.5 px-4">Entry Price</th>
              <th className="py-3.5 px-4">Exit Price</th>
              <th className="py-3.5 px-4">Investment</th>
              <th className="py-3.5 px-4">Realized P/L</th>
              <th className="py-3.5 px-4">Return</th>
              <th className="py-3.5 px-4">Exit Reason</th>
              <th className="py-3.5 px-4">Closed At</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-brand-muted">
                  <p className="text-sm font-semibold text-brand-text">No trade records found</p>
                  <p className="text-xs mt-1">Try resetting the result tab, search query, or date range.</p>
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const isProfit = trade.realizedPL >= 0;

                return (
                  <tr
                    key={trade.id}
                    className="hover:bg-pink-50/30 transition-colors group"
                  >
                    {/* Trade ID */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-brand-text">
                      <span
                        className="hover:text-brand-primary cursor-pointer"
                        onClick={() => onViewDetails(trade)}
                      >
                        <span title={trade.id}>{trade.id.slice(0, 8)}</span>
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="py-3.5 px-4 font-bold text-brand-text">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-pink-100 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                          {trade.symbol.substring(0, 2)}
                        </span>
                        <span>{trade.symbol}</span>
                      </div>
                    </td>

                    {/* Side */}
                    <td className="py-3.5 px-4 font-semibold text-brand-muted">
                      {trade.side}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-text">
                      {fmtQty(trade.quantity)}
                    </td>

                    {/* Entry Price */}
                    <td className="py-3.5 px-4 font-mono text-brand-text">
                      ${trade.entryPrice.toFixed(2)}
                    </td>

                    {/* Exit Price */}
                    <td className="py-3.5 px-4 font-mono font-medium text-brand-text">
                      ${trade.exitPrice.toFixed(2)}
                    </td>

                    {/* Investment */}
                    <td className="py-3.5 px-4 font-mono text-brand-muted">
                      ${trade.investment.toFixed(2)}
                    </td>

                    {/* Realized P/L */}
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isProfit ? 'text-brand-success' : 'text-brand-danger'
                        }`}
                      >
                        {isProfit ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {isProfit ? `+$${trade.realizedPL.toFixed(2)}` : `-$${Math.abs(trade.realizedPL).toFixed(2)}`}
                      </span>
                    </td>

                    {/* Return % */}
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-semibold ${
                          isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {isProfit ? `+${trade.returnPct.toFixed(2)}%` : `${trade.returnPct.toFixed(2)}%`}
                      </span>
                    </td>

                    {/* Exit Reason */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] ${getExitReasonClass(trade.exitReason)}`}>
                        {trade.exitReason}
                      </span>
                    </td>

                    {/* Closed At */}
                    <td className="py-3.5 px-4 text-brand-muted text-[11px] whitespace-nowrap">
                      {trade.formattedClosedAt}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetails(trade)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-primary hover:bg-pink-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

