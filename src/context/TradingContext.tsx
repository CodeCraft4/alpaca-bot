import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { API_CONFIGURED, api, apiUrl } from '../lib/api';
import { fmtQty } from '../lib/format';
import type {
  ActivityItem,
  CompletedTrade,
  ExitReason,
  OpenPosition,
  OrderItem,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../types/trading';
import { DEFAULT_SETTINGS, type TradingSettingsState } from '../types/settings';

export interface NewOrderPayload {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  dollarAmount?: number;
  limitPrice?: number;
  targetPct: number;
  stopLossPct: number;
  notes?: string;
}

export interface TradingContextType {
  // Account & Market
  equity: number;
  availableCash: number;
  currentPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  marketOpen: boolean;
  priceSource: string;
  /** Time of the last real trade (ms) and Alpaca's own last price, for the "how fresh is this" display */
  lastTradeTs: number;
  alpacaPrice: number | null;
  streamLive: boolean;
  isConnecting: boolean;
  lastUpdated: string;
  backendError: string | null;

  // Data Collections
  openPositions: OpenPosition[];
  orders: OrderItem[];
  completedTrades: CompletedTrade[];
  recentActivities: ActivityItem[];
  settings: TradingSettingsState;

  // Actions (all logic runs on the backend)
  createNewOrder: (payload: NewOrderPayload) => Promise<{ success: boolean; orderId: string; error?: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  editOrderTargets: (
    orderId: string,
    targetPct: number,
    targetPrice: number,
    stopLossPct: number,
    stopLossPrice: number
  ) => Promise<void>;
  sellPosition: (positionId: string) => Promise<void>;
  sellOrder: (orderId: string, qty?: number) => Promise<void>; // sell only the shares bought by this order
  updateSettings: (partial: Partial<TradingSettingsState>) => void;
  resetSettings: () => void;
  refreshAlpacaData: () => Promise<void>;
  /** Manual refresh: reloads account, orders, trades AND makes the chart / analysis card reload too. */
  refreshAll: () => Promise<void>;
  refreshNonce: number;
}

// ---- Backend response shapes -------------------------------------------------
interface ApiQuote { price: number; change: number; changePct: number; marketOpen: boolean; source: string }
interface ApiAccount { equity: number; cash: number }
interface ApiPosition {
  id: string; symbol: string; quantity: number; avgEntry: number; currentPrice: number; unrealizedPL: number;
  targetPrice: number | null; stopLossPrice: number | null; stopLossPct: number | null; marketValue: number; unrealizedPLPct: number;
}
interface ApiOrder {
  id: string; symbol: string; side: 'buy' | 'sell'; type: 'market' | 'limit'; quantity: number | null;
  notional: number | null; filledQty: number; avgFillPrice: number | null; limitPrice: number | null; status: string;
  timeInForce: string; targetPct: number | null; stopLossPct: number | null; targetPrice: number | null;
  stopLossPrice: number | null; entryPrice: number | null; notes: string | null; submittedAt: string | null;
  reviewDueAt: string | null;
  openQty: number; realizedPL: number; unrealizedPL: number; unrealizedPLPct: number | null;
  potentialProfit: number | null; potentialLoss: number | null;
}
interface ApiTrade {
  id: string; symbol: string; quantity: number; entryPrice: number; exitPrice: number; investment: number;
  exitValue: number; realizedPL: number; returnPct: number; exitReason: ExitReason; enteredAt: string;
  closedAt: string; holdingSeconds: number; notes: string | null;
}
interface ApiActivity { id: number; type: string; level: string; title: string; detail: string | null; createdAt: string }

// ---- Mappers -----------------------------------------------------------------
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

const mapStatus = (s: string): OrderStatus => {
  if (s === 'filled') return 'Filled';
  if (s === 'canceled' || s === 'cancelled') return 'Cancelled';
  if (s === 'rejected' || s === 'expired') return 'Rejected';
  if (s === 'pending_new' || s === 'pending_replace') return 'Pending';
  return 'Active';
};

const mapOrder = (o: ApiOrder, s: TradingSettingsState): OrderItem => {
  const entry = o.avgFillPrice ?? o.limitPrice ?? o.entryPrice ?? 0;
  const tif = o.timeInForce.toUpperCase();
  return {
    id: o.id,
    symbol: o.symbol,
    side: o.side === 'buy' ? 'Buy' : 'Sell',
    type: o.type === 'limit' ? 'Limit' : 'Market',
    quantity: o.quantity ?? (o.notional && entry ? o.notional / entry : 0),
    filledQty: o.filledQty,
    avgFillPrice: o.avgFillPrice,
    limitPrice: o.limitPrice ?? undefined,
    status: mapStatus(o.status),
    createdAt: o.submittedAt ?? new Date().toISOString(),
    formattedDate: fmtDate(o.submittedAt),
    timeInForce: (['GTC', 'IOC', 'FOK'].includes(tif) ? tif : 'DAY') as OrderItem['timeInForce'],
    targetPct: o.targetPct ?? s.profitTargetPct,
    targetPrice: o.targetPrice ?? 0,
    stopLossPct: o.stopLossPct ?? s.stopLossPct,
    stopLossPrice: o.stopLossPrice ?? 0,
    entryPrice: entry,
    notes: o.notes ?? undefined,
    amountUsd:
      o.filledQty > 0 && o.avgFillPrice
        ? o.filledQty * o.avgFillPrice
        : (o.notional ?? (o.quantity ?? 0) * (o.limitPrice ?? entry)),
    reviewDueAt: o.reviewDueAt,
    openQty: o.openQty,
    realizedPL: o.realizedPL,
    unrealizedPL: o.unrealizedPL,
    unrealizedPLPct: o.unrealizedPLPct,
    potentialProfit: o.potentialProfit,
    potentialLoss: o.potentialLoss,
  };
};

const holdText = (sec: number) => {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

const mapTrade = (t: ApiTrade): CompletedTrade => ({
  id: t.id,
  symbol: t.symbol,
  side: 'Long',
  quantity: t.quantity,
  entryPrice: t.entryPrice,
  exitPrice: t.exitPrice,
  investment: t.investment,
  exitValue: t.exitValue,
  realizedPL: t.realizedPL,
  returnPct: t.returnPct,
  exitReason: t.exitReason,
  enteredAt: t.enteredAt,
  closedAt: t.closedAt,
  formattedClosedAt: fmtDate(t.closedAt),
  holdingDuration: holdText(t.holdingSeconds),
  notes: t.notes ?? undefined,
});

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'Just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};

const mapActivity = (a: ApiActivity): ActivityItem => ({
  id: `act-${a.id}`,
  title: a.title,
  detail: a.detail ?? '',
  timestamp: ago(a.createdAt),
  type: a.type === 'trade' ? 'trade' : a.type === 'config' ? 'config' : 'system',
  badgeColor: a.level === 'success' ? 'emerald' : a.level === 'warning' ? 'amber' : a.level === 'error' ? 'pink' : 'blue',
});

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [dailyChangePct, setDailyChangePct] = useState(0);
  const [equity, setEquity] = useState(0);
  const [availableCash, setAvailableCash] = useState(0);
  const [marketOpen, setMarketOpen] = useState(false);
  const [priceSource, setPriceSource] = useState('');
  const [lastTradeTs, setLastTradeTs] = useState(0);
  const [alpacaPrice, setAlpacaPrice] = useState<number | null>(null);
  const [streamLive, setStreamLive] = useState(false);
  const lastPushAt = useRef(0); // when the stream last delivered a price
  const [isConnecting, setIsConnecting] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Small toast so actions never need a loading dialog: it shows "sending", then the result and the time taken
  const [toast, setToast] = useState<{ id: number; text: string; kind: 'info' | 'success' | 'error' } | null>(null);
  const notify = useCallback((text: string, kind: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToast({ id, text, kind });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), kind === 'error' ? 7000 : 4000);
  }, []);

  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [completedTrades, setCompletedTrades] = useState<CompletedTrade[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [settings, setSettings] = useState<TradingSettingsState>(DEFAULT_SETTINGS);

  const refreshAlpacaData = useCallback(async () => {
    try {
      const [quote, account, positions, apiOrders, trades, activity, apiSettings] = await Promise.all([
        api<ApiQuote>('/market/quote'),
        api<ApiAccount>('/account'),
        api<ApiPosition[]>('/positions'),
        api<ApiOrder[]>('/orders?limit=100'),
        api<{ items: ApiTrade[] }>('/trades?limit=500'),
        api<ApiActivity[]>('/activity?limit=15'),
        api<TradingSettingsState>('/settings'),
      ]);

      // The live stream owns the price while it is delivering; polling only fills in when it is silent
      if (Date.now() - lastPushAt.current > 10_000) {
        setCurrentPrice(quote.price);
        setDailyChange(quote.change);
        setDailyChangePct(quote.changePct);
      }
      setMarketOpen(quote.marketOpen);
      setPriceSource(quote.source);
      setEquity(account.equity);
      setAvailableCash(account.cash);
      setSettings(apiSettings);
      setOpenPositions(
        positions.map((p) => ({
          id: p.id,
          symbol: p.symbol,
          quantity: p.quantity,
          avgEntry: p.avgEntry,
          currentPrice: p.currentPrice,
          unrealizedPL: p.unrealizedPL,
          marketValue: p.marketValue,
          unrealizedPLPct: p.unrealizedPLPct,
          targetPrice: p.targetPrice ?? +(p.avgEntry * (1 + apiSettings.profitTargetPct / 100)).toFixed(2),
          // 0 = no stop-loss (position is held until sold manually)
          stopLossPrice:
            p.stopLossPct === 0 || (p.stopLossPct == null && apiSettings.stopLossPct === 0)
              ? 0
              : (p.stopLossPrice ?? +(p.avgEntry * (1 - apiSettings.stopLossPct / 100)).toFixed(2)),
        })),
      );
      setOrders(apiOrders.map((o) => mapOrder(o, apiSettings)));
      setCompletedTrades(trades.items.map(mapTrade));
      setRecentActivities(activity.map(mapActivity));
      setBackendError(null);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      setBackendError((e as Error).message || 'Backend unreachable');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Live price stream (Server-Sent Events): the backend pushes every price change within ~100 ms
  useEffect(() => {
    if (typeof EventSource === 'undefined' || !API_CONFIGURED) return;
    const es = new EventSource(apiUrl('/stream/price'));
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data) as {
          price: number; change: number | null; changePct: number | null; lastTradeTs: number; alpaca: { price: number } | null;
        };
        lastPushAt.current = Date.now();
        setStreamLive(true);
        setCurrentPrice(d.price);
        if (d.change !== null) setDailyChange(d.change);
        if (d.changePct !== null) setDailyChangePct(d.changePct);
        setLastTradeTs(d.lastTradeTs);
        setAlpacaPrice(d.alpaca?.price ?? null);
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setStreamLive(false); // the browser reconnects by itself
    return () => es.close();
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshNonce((n) => n + 1);
    await refreshAlpacaData();
  }, [refreshAlpacaData]);

  useEffect(() => {
    void refreshAlpacaData();
    const t = setInterval(() => void refreshAlpacaData(), 5000);
    return () => clearInterval(t);
  }, [refreshAlpacaData]);

  const createNewOrder: TradingContextType['createNewOrder'] = async (p) => {
    const what = `${p.side.toUpperCase()} ${p.dollarAmount ? `$${p.dollarAmount.toFixed(2)}` : `${fmtQty(p.quantity ?? 0)} sh`}`;
    notify(`Sending ${what}…`);
    const t0 = performance.now();
    try {
      const body: Record<string, unknown> = {
        symbol: p.symbol,
        side: p.side.toLowerCase(),
        type: p.type === 'Limit' ? 'limit' : 'market',
        targetPct: p.targetPct,
        stopLossPct: p.stopLossPct,
      };
      if (p.dollarAmount && p.dollarAmount > 0) body.notional = p.dollarAmount;
      else body.qty = p.quantity;
      if (p.type === 'Limit' && p.limitPrice) body.limitPrice = p.limitPrice;
      if (p.notes) body.notes = p.notes;
      const o = await api<ApiOrder>('/orders', { method: 'POST', body: JSON.stringify(body) });
      void refreshAlpacaData();
      notify(`${what} placed in ${Math.round(performance.now() - t0)} ms`, 'success');
      return { success: true, orderId: o.id };
    } catch (e) {
      notify(`${what} failed: ${(e as Error).message}`, 'error');
      return { success: false, orderId: '', error: (e as Error).message };
    }
  };

  const cancelOrder = async (orderId: string) => {
    await api(`/orders/${orderId}`, { method: 'DELETE' })
      .then(() => notify('Order cancelled', 'success'))
      .catch((e) => notify(`Cancel failed: ${(e as Error).message}`, 'error'));
    void refreshAlpacaData();
  };

  const editOrderTargets: TradingContextType['editOrderTargets'] = async (orderId, targetPct) => {
    await api(`/orders/${orderId}/targets`, {
      method: 'PATCH',
      body: JSON.stringify({ targetPct }), // stop-loss is not used
    }).catch((e) => setBackendError((e as Error).message));
    await refreshAlpacaData();
  };

  const sellPosition = async (positionId: string) => {
    const pos = openPositions.find((p) => p.id === positionId);
    if (!pos) return;
    notify(`Selling ${fmtQty(pos.quantity)} ${pos.symbol}…`);
    const t0 = performance.now();
    await api(`/positions/${pos.symbol}/close`, { method: 'POST', body: '{}' })
      .then(() => notify(`Sell sent in ${Math.round(performance.now() - t0)} ms`, 'success'))
      .catch((e) => notify(`Sell failed: ${(e as Error).message}`, 'error'));
    void refreshAlpacaData(); // do not wait for the refresh
  };

  const sellOrder = async (orderId: string, qty?: number) => {
    notify(`Selling order ${orderId.slice(0, 8)}…`);
    const t0 = performance.now();
    await api(`/orders/${orderId}/sell`, { method: 'POST', body: JSON.stringify(qty ? { qty } : {}) })
      .then(() => notify(`Sell sent in ${Math.round(performance.now() - t0)} ms`, 'success'))
      .catch((e) => notify(`Sell failed: ${(e as Error).message}`, 'error'));
    void refreshAlpacaData();
  };

  const updateSettings = (partial: Partial<TradingSettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial })); // optimistic
    api<TradingSettingsState>('/settings', { method: 'PUT', body: JSON.stringify(partial) })
      .then(setSettings)
      .catch((e) => {
        setBackendError((e as Error).message);
        void refreshAlpacaData();
      });
  };

  const resetSettings = () => {
    api<TradingSettingsState>('/settings/reset', { method: 'POST', body: '{}' })
      .then(setSettings)
      .catch((e) => setBackendError((e as Error).message));
  };

  return (
    <TradingContext.Provider
      value={{
        equity, availableCash, currentPrice, dailyChange, dailyChangePct, marketOpen, priceSource, lastTradeTs, alpacaPrice, streamLive, isConnecting, lastUpdated,
        backendError, openPositions, orders, completedTrades, recentActivities, settings,
        createNewOrder, cancelOrder, editOrderTargets, sellPosition, sellOrder, updateSettings, resetSettings, refreshAlpacaData, refreshAll, refreshNonce,
      }}
    >
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-lg border ${
            toast.kind === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.kind === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-white text-brand-text border-brand-border'
          }`}
        >
          {toast.text}
        </div>
      )}
    </TradingContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useTradingContext = (): TradingContextType => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTradingContext must be used within a TradingProvider');
  return context;
};
