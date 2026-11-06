import React, { useMemo, useState } from 'react';
import { Plus, RotateCw } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SummaryStatCard } from '../components/overview/SummaryStatCard';
import { ABNBPriceChart } from '../components/overview/ABNBPriceChart';
import { AIMarketAnalysisCard } from '../components/overview/AIMarketAnalysisCard';
import { OpenPositionsTable } from '../components/overview/OpenPositionsTable';
// import { RecentActivityList } from '../components/overview/RecentActivityList';
import { NewOrderModal } from '../components/orders/NewOrderModal';
import { useTradingContext } from '../context/TradingContext';
import {
  Wallet3D,
  Cash3D,
  Layers3D,
  Target3D,
} from '../components/ui/icons3d';

export const OverviewPage: React.FC = () => {
  const { equity, availableCash, openPositions, completedTrades, currentPrice, refreshAll, lastUpdated } = useTradingContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  // Compute live unrealized & realized net profit
  const totalUnrealizedPL = useMemo(() => {
    return openPositions.reduce(
      (sum, p) => sum + p.quantity * (currentPrice - p.avgEntry),
      0
    );
  }, [openPositions, currentPrice]);

  const totalRealizedPL = useMemo(() => {
    return completedTrades.reduce((sum, t) => sum + t.realizedPL, 0);
  }, [completedTrades]);

  const netPL = Math.round((totalRealizedPL + totalUnrealizedPL) * 100) / 100;
  const isPositive = netPL >= 0;
  const netPLFormatted = `${isPositive ? '+' : '-'}$${Math.abs(netPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const baseCapital = equity - netPL > 0 ? equity - netPL : 100;
  const netPLPct = ((netPL / baseCapital) * 100).toFixed(2);
  const changeFormatted = `${isPositive ? '+' : ''}${netPLPct}%`;

  return (
    <>
      <PageContainer
        title="Overview Dashboard"
        description="Real-time live algorithmic monitoring and paper trading for ABNB."
        action={
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-brand-primary font-bold text-xs">
              <Target3D size={18} />
              <span>ABNB • Airbnb, Inc.</span>
            </span>

            <span className="hidden md:inline text-[11px] text-brand-muted font-mono">
              auto-refresh 5s{lastUpdated ? ` · ${lastUpdated}` : ''}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-muted hover:text-brand-sidebar hover:border-pink-300 shadow-sm transition-all active:scale-95 disabled:opacity-70"
              aria-label="Refresh overview"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* New Order Button on Overview Page */}
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-sidebar shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>
          </div>
        }
      >
        {/* 1. Top Summary Cards with 3D Realistic Icons */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryStatCard
            label="Total Account Equity"
            value={`$${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext="Portfolio Value"
            icon3d={<Wallet3D size={38} />}
          />
          <SummaryStatCard
            label="Available Cash"
            value={`$${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext="Unsettled: $0.00"
            icon3d={<Cash3D size={38} />}
          />
          <SummaryStatCard
            label="Currently Open"
            value={`${openPositions.length}`}
            subtext={openPositions.length === 1 ? '1 active position' : `${openPositions.length} active positions`}
            icon3d={<Layers3D size={38} />}
          />
          <SummaryStatCard
            label="Total Profit"
            value={netPLFormatted}
            change={changeFormatted}
            isPositive={isPositive}
            subtext="Net paper return"
            icon3d={<Wallet3D size={38} />}
          />
        </section>

        {/* 2. Interactive Charts & Real-time Visuals */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ABNBPriceChart />
          </div>
          {/* On desktop the AI card is taken out of the layout flow (absolute) so the chart alone sets the
              row height; the card then matches it exactly and scrolls internally. */}
          <div className="relative lg:min-h-[440px]">
            <div className="lg:absolute lg:inset-0">
              <AIMarketAnalysisCard />
            </div>
          </div>
        </section>

        {/* 3. Open Positions Table */}
        <section>
          <OpenPositionsTable />
        </section>

        {/* 4. Recent Activity Feed */}
        {/* <section>
          <RecentActivityList />
        </section> */}
      </PageContainer>

      {/* New Order Modal on Overview */}
      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </>
  );
};
