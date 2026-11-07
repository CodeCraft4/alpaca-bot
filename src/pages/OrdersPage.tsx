import React, { useState, useMemo } from 'react';
import { RotateCw, Plus } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useTradingContext } from '../context/TradingContext';
import { OrderStatsCards } from '../components/orders/OrderStatsCards';
import { HoldingsSummary } from '../components/orders/HoldingsSummary';
import { LiveOpenOrders } from '../components/orders/LiveOpenOrders';
import {
  OrderFilters,
  type StatusTab,
  type DateFilter,
  type SortOption,
} from '../components/orders/OrderFilters';
import { OrdersTable } from '../components/orders/OrdersTable';
import { OrdersPagination } from '../components/orders/OrdersPagination';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
import { EditTargetsModal } from '../components/orders/EditTargetsModal';
import { CancelOrderModal } from '../components/orders/CancelOrderModal';
import { NewOrderModal } from '../components/orders/NewOrderModal';
import { MarketClosed3D } from '../components/ui/icons3d';
import type { OrderItem } from '../types/trading';

const PAGE_SIZE = 8;

export const OrdersPage: React.FC = () => {
  // Shared global Trading Context
  const { orders, cancelOrder, editOrderTargets, refreshAll, marketOpen, marketStatusKnown } = useTradingContext();
  const closed = marketStatusKnown && !marketOpen; // market closed: browsing is fine, trading is off

  const [selectedTab, setSelectedTab] = useState<StatusTab>('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All Time');
  const [sortOption, setSortOption] = useState<SortOption>('Newest First');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrderItem | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<OrderItem | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderItem | null>(null);

  // Handle Refresh UI action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status tab filter
        if (selectedTab !== 'All Orders' && order.status !== selectedTab) {
          return false;
        }

        // Search query filter (Order ID or Symbol)
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const matchId = order.id.toLowerCase().includes(query);
          const matchSymbol = order.symbol.toLowerCase().includes(query);
          if (!matchId && !matchSymbol) {
            return false;
          }
        }

        // Date filter
        if (dateFilter !== 'All Time') {
          const orderDate = new Date(order.createdAt).getTime();
          const referenceNow = new Date('2026-11-05T23:59:59Z').getTime();
          const oneDayMs = 24 * 60 * 60 * 1000;

          if (dateFilter === 'Today') {
            const startOfToday = new Date('2026-11-05T00:00:00Z').getTime();
            if (orderDate < startOfToday) return false;
          } else if (dateFilter === 'Last 7 Days') {
            if (orderDate < referenceNow - 7 * oneDayMs) return false;
          } else if (dateFilter === 'Last 30 Days') {
            if (orderDate < referenceNow - 30 * oneDayMs) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOption === 'Newest First' ? timeB - timeA : timeA - timeB;
      });
  }, [orders, selectedTab, searchQuery, dateFilter, sortOption]);

  // Paginated subset
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const handleTabChange = (tab: StatusTab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (date: DateFilter) => {
    setDateFilter(date);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedTab('All Orders');
    setSearchQuery('');
    setDateFilter('All Time');
    setSortOption('Newest First');
    setCurrentPage(1);
  };

  return (
    <PageContainer
      title="Orders"
      description="Manage and monitor all your paper trading orders."
      action={
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* New Order Button */}
          <button
            type="button"
            onClick={() => !closed && setIsNewOrderOpen(true)}
            disabled={closed}
            title={closed ? 'Market is closed: new orders are disabled' : 'Place a new order'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
              closed ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-brand-sidebar active:scale-95'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-muted hover:text-brand-sidebar hover:border-pink-300 shadow-sm transition-all active:scale-95"
            aria-label="Refresh orders"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      }
    >
      {/* 2. Order Statistics Cards */}
      <section>
        {closed && (
          <div role="status" className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
            <MarketClosed3D size={40} />
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-red-600">Market closed</p>
              <p className="text-xs text-red-900/80">You can review your orders and history. New orders and selling are disabled until the market opens.</p>
            </div>
          </div>
        )}

        <HoldingsSummary />
        <LiveOpenOrders onViewDetails={setSelectedOrderForDetails} onEditTargets={setSelectedOrderForEdit} />
        <OrderStatsCards orders={orders} />
      </section>

      {/* 3. Filters & Search */}
      <section>
        <OrderFilters
          orders={orders}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
        />
      </section>

      {/* 4 & 8. Orders Table with Integrated Pagination */}
      <section className="space-y-0">
        <OrdersTable
          orders={paginatedOrders}
          onViewDetails={(order) => setSelectedOrderForDetails(order)}
          onEditTargets={(order) => setSelectedOrderForEdit(order)}
          onCancelOrder={(order) => setSelectedOrderForCancel(order)}
        />
        {filteredOrders.length > 0 && (
          <OrdersPagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </section>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
      />

      {/* 6. Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrderForDetails}
        isOpen={Boolean(selectedOrderForDetails)}
        onClose={() => setSelectedOrderForDetails(null)}
      />

      {/* 7. Edit Targets Modal */}
      <EditTargetsModal
        order={selectedOrderForEdit}
        isOpen={Boolean(selectedOrderForEdit)}
        onClose={() => setSelectedOrderForEdit(null)}
        onSave={editOrderTargets}
      />

      {/* 5. Cancel Order Modal */}
      <CancelOrderModal
        order={selectedOrderForCancel}
        isOpen={Boolean(selectedOrderForCancel)}
        onClose={() => setSelectedOrderForCancel(null)}
        onConfirmCancel={cancelOrder}
      />
    </PageContainer>
  );
};

export default OrdersPage;
