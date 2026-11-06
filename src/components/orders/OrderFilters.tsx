import React from 'react';
import { Search, Calendar, ArrowUpDown, X } from 'lucide-react';
import type { OrderStatus, OrderItem } from '../../types/trading';

export type StatusTab = 'All Orders' | OrderStatus;
export type DateFilter = 'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days';
export type SortOption = 'Newest First' | 'Oldest First';

export interface OrderFiltersProps {
  orders: OrderItem[];
  selectedTab: StatusTab;
  onTabChange: (tab: StatusTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (date: DateFilter) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  onResetFilters: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  orders,
  selectedTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  sortOption,
  onSortChange,
  onResetFilters,
}) => {
  const tabs: StatusTab[] = [
    'All Orders',
    'Active',
    'Pending',
    'Filled',
    'Cancelled',
    'Rejected',
  ];

  const getTabCount = (tab: StatusTab) => {
    if (tab === 'All Orders') return orders.length;
    return orders.filter((o) => o.status === tab).length;
  };

  const hasActiveFilters =
    selectedTab !== 'All Orders' ||
    searchQuery.trim() !== '' ||
    dateFilter !== 'All Time' ||
    sortOption !== 'Newest First';

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5 space-y-4">
      {/* Top row: Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-brand-border/60">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab;
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
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

      {/* Bottom row: Search input + Date filter + Sort selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Symbol (e.g. ABNB) or Order ID (e.g. ORD-1024)..."
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
          {/* Date Dropdown */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
              className="pl-8 pr-7 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary cursor-pointer hover:border-pink-300 transition-colors appearance-none"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="pl-8 pr-7 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary cursor-pointer hover:border-pink-300 transition-colors appearance-none"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
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

