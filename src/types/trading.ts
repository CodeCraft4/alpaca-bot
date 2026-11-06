// Shared domain types (no mock data lives here)

export interface ConnectionStatus {
  railwayWorker: {
    status: 'online' | 'offline' | 'degraded';
    latencyMs: number;
    lastHeartbeat: string;
    version: string;
  };
  alpaca: {
    status: 'connected' | 'disconnected' | 'connecting';
    mode: 'PAPER TRADING' | 'LIVE TRADING';
    accountNumber: string;
    currency: string;
  };
  market: {
    isOpen: boolean;
    statusText: string;
    nextSession: string;
  };
}

export interface UserProfileData {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  initials: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface SummaryStat {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  ma?: number;
  volume?: number;
}

export interface AIMarketSentiment {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  confidence: number;
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
  summary: string;
  disclaimer: string;
}

export interface OpenPosition {
  id: string;
  symbol: string;
  quantity: number;
  avgEntry: number;
  currentPrice: number;
  unrealizedPL: number;
  targetPrice: number;
  stopLossPrice: number;
  marketValue?: number;
  unrealizedPLPct?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'trade' | 'config' | 'system';
  badgeColor?: 'pink' | 'emerald' | 'amber' | 'blue';
}

export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'Limit' | 'Stop' | 'Stop Limit';
export type OrderStatus = 'Active' | 'Pending' | 'Filled' | 'Cancelled' | 'Rejected';

export interface OrderItem {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  filledQty: number;
  avgFillPrice: number | null;
  limitPrice?: number;
  status: OrderStatus;
  createdAt: string; // ISO date string for filtering & sorting
  formattedDate: string; // Display string
  timeInForce: 'GTC' | 'DAY' | 'IOC' | 'FOK';
  targetPct: number;
  targetPrice: number;
  stopLossPct: number;
  stopLossPrice: number;
  entryPrice: number;
  notes?: string;
  reviewDueAt?: string | null; // when we will next ask "target not hit: what now?"
  amountUsd?: number; // dollars this order is worth (filled value, or ordered amount)
  // Profit/loss computed by the backend
  openQty?: number;
  realizedPL?: number;
  unrealizedPL?: number;
  unrealizedPLPct?: number | null;
  potentialProfit?: number | null;
  potentialLoss?: number | null;
}

export type ExitReason = 'Profit Target' | 'Stop Loss' | 'Manual Sell';

export interface CompletedTrade {
  id: string;
  symbol: string;
  side: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  investment: number;
  exitValue: number;
  realizedPL: number;
  returnPct: number;
  exitReason: ExitReason;
  enteredAt: string;
  closedAt: string;
  formattedClosedAt: string;
  holdingDuration: string;
  notes?: string;
}

export interface PLChartPoint {
  date: string;
  cumulativePL: number;
  dailyPL: number;
}
