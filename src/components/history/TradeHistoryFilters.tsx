import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import type { ExitReason, CompletedTrade } from '../../types/trading';

export type ResultFilter = 'All Trades' | 'Wins' | 'Losses';
export type TradeDateFilter = 'All Time' | 'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days';
export type ExitReasonFilter = 'All Reasons' | ExitReason;

export interface TradeHistoryFiltersProps {
  trades: CompletedTrade[];
  resultFilter: ResultFilter;
  onResultFilterChange: (val: ResultFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: TradeDateFilter;
  onDateRangeChange: (val: TradeDateFilter) => void;
  exitReason: ExitReasonFilter;
  onExitReasonChange: (val: ExitReasonFilter) => void;
  onResetFilters: () => void;
}

export const TradeHistoryFilters: React.FC<TradeHistoryFiltersProps> = ({
  trades,
  resultFilter,
  onResultFilterChange,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  exitReason,
  onExitReasonChange,
  onResetFilters,
}) => {
  const resultTabs: ResultFilter[] = ['All Trades', 'Wins', 'Losses'];

  const getResultCount = (filter: ResultFilter) => {
    if (filter === 'All Trades') return trades.length;
    if (filter === 'Wins') return trades.filter((t) => t.realizedPL > 0).length;
    return trades.filter((t) => t.realizedPL <= 0).length;
  };

  const hasActiveFilters =
    resultFilter !== 'All Trades' ||
    searchQuery.trim() !== '' ||
    dateRange !== 'All Time' ||
    exitReason !== 'All Reasons';

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5 space-y-4">
      {/* Top row: Result tabs (All Trades, Wins, Losses) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-brand-border/60">
        {resultTabs.map((tab) => {
          const isSelected = resultFilter === tab;
          const count = getResultCount(tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onResultFilterChange(tab)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text hover:bg-pink-50/60'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-bg text-brand-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom row: Search input + Date Range + Exit Reason + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Trade ID (e.g. TRD-1032) or Symbol..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-brand-border bg-brand-bg/50 text-brand-text placeholder-brand-muted text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Date Range Dropdown */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as TradeDateFilter)}
              className="pl-8 pr-7 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary cursor-pointer hover:border-pink-300 transition-colors appearance-none"
            >
              <option value="All Time">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </div>

          {/* Exit Reason Dropdown */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            <select
              value={exitReason}
              onChange={(e) => onExitReasonChange(e.target.value as ExitReasonFilter)}
              className="pl-8 pr-7 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary cursor-pointer hover:border-pink-300 transition-colors appearance-none"
            >
              <option value="All Reasons">All Reasons</option>
              <option value="Profit Target">Profit Target</option>
              <option value="Stop Loss">Stop Loss</option>
              <option value="Manual Sell">Manual Sell</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-2 text-xs font-semibold text-brand-muted hover:text-brand-primary hover:bg-pink-50 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

