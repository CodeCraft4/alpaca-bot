import React, { useState, useMemo } from 'react';
import { Download, RotateCw } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import type { CompletedTrade } from '../types/trading';
import { TradeStatsCards } from '../components/history/TradeStatsCards';
import { ProfitLossChart } from '../components/history/ProfitLossChart';
import { TradeDistributionChart } from '../components/history/TradeDistributionChart';
import {
  TradeHistoryFilters,
  type ResultFilter,
  type TradeDateFilter,
  type ExitReasonFilter,
} from '../components/history/TradeHistoryFilters';
import { CompletedTradesTable } from '../components/history/CompletedTradesTable';
import { TradeHistoryPagination } from '../components/history/TradeHistoryPagination';
import { TradeDetailsModal } from '../components/history/TradeDetailsModal';
import { useTradingContext } from '../context/TradingContext';
import { fmtQty } from '../lib/format';

const PAGE_SIZE = 8;

export const TradeHistoryPage: React.FC = () => {
  const { completedTrades, refreshAll } = useTradingContext();
  const trades = completedTrades;
  const [resultFilter, setResultFilter] = useState<ResultFilter>('All Trades');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<TradeDateFilter>('All Time');
  const [exitReason, setExitReason] = useState<ExitReasonFilter>('All Reasons');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<CompletedTrade | null>(null);

  // Refresh visual interaction
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filter logic
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // 1. Result Filter (Wins / Losses)
      if (resultFilter === 'Wins' && trade.realizedPL <= 0) return false;
      if (resultFilter === 'Losses' && trade.realizedPL > 0) return false;

      // 2. Search (Trade ID or Symbol)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchId = trade.id.toLowerCase().includes(query);
        const matchSymbol = trade.symbol.toLowerCase().includes(query);
        if (!matchId && !matchSymbol) return false;
      }

      // 3. Exit Reason
      if (exitReason !== 'All Reasons' && trade.exitReason !== exitReason) {
        return false;
      }

      // 4. Date Range
      if (dateRange !== 'All Time') {
        const tradeTime = new Date(trade.closedAt).getTime();
        const referenceNow = new Date('2026-11-05T23:59:59Z').getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (dateRange === 'Last 7 Days') {
          if (tradeTime < referenceNow - 7 * oneDayMs) return false;
        } else if (dateRange === 'Last 30 Days') {
          if (tradeTime < referenceNow - 30 * oneDayMs) return false;
        } else if (dateRange === 'Last 90 Days') {
          if (tradeTime < referenceNow - 90 * oneDayMs) return false;
        }
      }

      return true;
    });
  }, [trades, resultFilter, searchQuery, exitReason, dateRange]);

  // Paginated records
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTrades.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTrades, currentPage]);

  // Filter handlers with page reset
  const handleResultFilterChange = (filter: ResultFilter) => {
    setResultFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: TradeDateFilter) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleExitReasonChange = (reason: ExitReasonFilter) => {
    setExitReason(reason);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setResultFilter('All Trades');
    setSearchQuery('');
    setDateRange('All Time');
    setExitReason('All Reasons');
    setCurrentPage(1);
  };

  // Export CSV of currently filtered trades
  const handleExportCSV = () => {
    const headers = [
      'Trade ID',
      'Symbol',
      'Side',
      'Quantity',
      'Entry Price ($)',
      'Exit Price ($)',
      'Investment ($)',
      'Realized P/L ($)',
      'Return (%)',
      'Exit Reason',
      'Closed At',
    ];

    const rows = filteredTrades.map((t) => [
      t.id,
      t.symbol,
      t.side,
      fmtQty(t.quantity),
      t.entryPrice.toFixed(2),
      t.exitPrice.toFixed(2),
      t.investment.toFixed(2),
      t.realizedPL.toFixed(2),
      `${t.returnPct.toFixed(2)}%`,
      `"${t.exitReason}"`,
      `"${t.formattedClosedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'abnb-trade-history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Trade History"
      description="Review your completed trades and trading performance."
      action={
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-text hover:text-brand-primary hover:border-pink-300 shadow-sm transition-all active:scale-95"
            title="Download CSV of current results"
          >
            <Download className="w-3.5 h-3.5 text-brand-primary" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-muted hover:text-brand-sidebar hover:border-pink-300 shadow-sm transition-all active:scale-95"
            aria-label="Refresh trade history"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      }
    >
      {/* 2. Performance Summary Cards */}
      <section>
        <TradeStatsCards trades={trades} />
      </section>

      {/* 3. Performance Analytics (Profit & Loss Chart + Trade Distribution) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfitLossChart />
        </div>
        <div className="lg:col-span-1">
          <TradeDistributionChart trades={trades} />
        </div>
      </section>

      {/* 4. Filters & Search */}
      <section>
        <TradeHistoryFilters
          trades={trades}
          resultFilter={resultFilter}
          onResultFilterChange={handleResultFilterChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          exitReason={exitReason}
          onExitReasonChange={handleExitReasonChange}
          onResetFilters={handleResetFilters}
        />
      </section>

      {/* 5 & 7. Completed Trades Table & Pagination */}
      <section className="space-y-0">
        <CompletedTradesTable
          trades={paginatedTrades}
          onViewDetails={(trade) => setSelectedTrade(trade)}
        />
        {filteredTrades.length > 0 && (
          <TradeHistoryPagination
            currentPage={currentPage}
            totalItems={filteredTrades.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </section>

      {/* 6. Trade Details Modal */}
      <TradeDetailsModal
        trade={selectedTrade}
        isOpen={Boolean(selectedTrade)}
        onClose={() => setSelectedTrade(null)}
      />
    </PageContainer>
  );
};

export default TradeHistoryPage;
