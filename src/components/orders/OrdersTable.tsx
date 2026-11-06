import React, { useState } from 'react';
import { Eye, Sliders, XCircle, MoreVertical, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { OrderItem } from '../../types/trading';
import { OrderStatusBadge, OrderSideBadge } from './OrderStatusBadge';
import { fmtQty, fmtSigned, fmtUsd } from '../../lib/format';
import { useTradingContext } from '../../context/TradingContext';

/** P/L cell: open lots show live unrealized P/L, closed ones realized, waiting orders the potential outcome. */
/** For an order that still holds shares: its own target and when the next review email is due. */
const ReviewNote: React.FC<{ order: OrderItem }> = ({ order }) => {
  const { settings } = useTradingContext();
  if (!(order.status === 'Filled' && order.side === 'Buy' && (order.openQty ?? 0) > 1e-8)) return null;
  const due = order.reviewDueAt
    ? new Date(order.reviewDueAt).getTime()
    : new Date(order.createdAt).getTime() + settings.holdingReviewDays * 86_400_000;
  const ms = due - Date.now();
  const left = ms <= 0 ? 'review due' : ms >= 86_400_000 ? `${Math.floor(ms / 86_400_000)}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h` : `${Math.max(1, Math.floor(ms / 3_600_000))}h`;
  return (
    <span className="block text-[10px] text-brand-muted mt-1 font-mono whitespace-nowrap">
      target ${order.targetPrice.toFixed(2)} (+{order.targetPct}%) · review {ms <= 0 ? 'due' : `in ${left}`}
    </span>
  );
};

const PlCell: React.FC<{ order: OrderItem }> = ({ order }) => {
  const color = (n: number) => (n >= 0 ? 'text-brand-success' : 'text-brand-danger');
  const open = (order.openQty ?? 0) > 1e-8;
  const realized = order.realizedPL ?? 0;

  if (order.status === 'Filled') {
    if (open) {
      const u = order.unrealizedPL ?? 0;
      return (
        <div className="font-mono">
          <span className={`font-bold ${color(u)}`}>
            {fmtSigned(u)}
            {order.unrealizedPLPct != null && (
              <span className="text-[10px] ml-1">
                ({order.unrealizedPLPct >= 0 ? '+' : ''}
                {order.unrealizedPLPct.toFixed(2)}%)
              </span>
            )}
          </span>
          <span className="block text-[10px] text-brand-muted">still holding · unrealized</span>
          {realized !== 0 && <span className={`block text-[10px] ${color(realized)}`}>{fmtSigned(realized)} realized</span>}
        </div>
      );
    }
    return (
      <div className="font-mono">
        <span className={`font-bold ${color(realized)}`}>{fmtSigned(realized)}</span>
        <span className="block text-[10px] text-brand-muted">sold · realized</span>
      </div>
    );
  }
  if (order.status === 'Active' || order.status === 'Pending') {
    return (
      <div className="font-mono text-[11px]">
        <span className="block text-emerald-600 font-semibold">{order.potentialProfit != null ? fmtSigned(order.potentialProfit) : '—'} at target</span>
        <span className="block text-brand-danger font-semibold">{order.potentialLoss != null ? fmtSigned(order.potentialLoss) : '—'} at stop</span>
      </div>
    );
  }
  return <span className="text-brand-muted">—</span>;
};

export interface OrdersTableProps {
  orders: OrderItem[];
  onViewDetails: (order: OrderItem) => void;
  onEditTargets: (order: OrderItem) => void;
  onCancelOrder: (order: OrderItem) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewDetails,
  onEditTargets,
  onCancelOrder,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Table Container with independent horizontal scrolling */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-brand-border/40 text-brand-muted font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4 sm:px-6">Order ID</th>
              <th className="py-3.5 px-4">Symbol</th>
              <th className="py-3.5 px-4">Side</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Shares</th>
              <th className="py-3.5 px-4">Amount ($)</th>
              <th className="py-3.5 px-4">Avg. Fill Price</th>
              <th className="py-3.5 px-4">Profit / Loss</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-brand-muted">
                  <p className="text-sm font-semibold text-brand-text">No orders match the selected filters</p>
                  <p className="text-xs mt-1">Try resetting the status tab, search query, or date range.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isWaiting = order.status === 'Active' || order.status === 'Pending';
                const holdingShares = order.status === 'Filled' && order.side === 'Buy' && (order.openQty ?? 0) > 1e-8;
                const canEditOrCancel = isWaiting || holdingShares; // edit target: waiting orders and orders still holding shares
                const isFilled = order.status === 'Filled';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-pink-50/30 transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-brand-text">
                      <span className="hover:text-brand-primary cursor-pointer" title={order.id} onClick={() => onViewDetails(order)}>
                        {order.id.length > 12 ? `${order.id.slice(0, 8)}…` : order.id}
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="py-3.5 px-4 font-bold text-brand-text">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-pink-100 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                          {order.symbol.substring(0, 2)}
                        </span>
                        <span>{order.symbol}</span>
                      </div>
                    </td>

                    {/* Side */}
                    <td className="py-3.5 px-4">
                      <OrderSideBadge side={order.side} />
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4 font-medium text-brand-muted">
                      {order.type}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-text">
                      {fmtQty(order.quantity)}
                    </td>

                    {/* Dollar value of the trade */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-text">
                      {fmtUsd(order.amountUsd ?? 0)}
                      <span className="block text-[10px] font-normal text-brand-muted">
                        {order.status === 'Filled' ? 'filled' : order.status === 'Cancelled' ? 'not filled' : 'ordered'}
                      </span>
                    </td>

                    {/* Avg. Fill Price */}
                    <td className="py-3.5 px-4 font-mono font-medium text-brand-text">
                      {order.avgFillPrice ? `$${order.avgFillPrice.toFixed(2)}` : '—'}
                    </td>

                    {/* Profit / Loss */}
                    <td className="py-3.5 px-4">
                      <PlCell order={order} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                      <ReviewNote order={order} />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-brand-muted text-[11px] whitespace-nowrap">
                      {order.formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 relative">
                        {/* Compact Quick Buttons */}
                        <button
                          type="button"
                          onClick={() => onViewDetails(order)}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-pink-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEditOrCancel && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditTargets(order)}
                              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-pink-50 transition-colors"
                              title="Edit Targets"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                            {isWaiting && (<button
                              type="button"
                              onClick={() => onCancelOrder(order)}
                              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-red-50 transition-colors"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>)}
                          </>
                        )}

                        {/* More Menu Dropdown for Mobile / Comprehensive Action List */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === order.id ? null : order.id)
                            }
                            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
                            aria-label="Order actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === order.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white border border-brand-border shadow-xl z-40 py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onViewDetails(order);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-brand-text hover:bg-pink-50 hover:text-brand-primary flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-brand-muted" />
                                  <span>View Details</span>
                                </button>

                                {canEditOrCancel && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onEditTargets(order);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-brand-text hover:bg-pink-50 hover:text-brand-primary flex items-center gap-2"
                                    >
                                      <Sliders className="w-3.5 h-3.5 text-brand-muted" />
                                      <span>Edit Targets</span>
                                    </button>
                                    {isWaiting && (<button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onCancelOrder(order);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-brand-danger hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Cancel Order</span>
                                    </button>)}
                                  </>
                                )}

                                {isFilled && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      navigate('/');
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-brand-text hover:bg-pink-50 hover:text-brand-primary flex items-center gap-2"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5 text-brand-success" />
                                    <span>View Position</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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

