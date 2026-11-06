import React from 'react';
import type { OrderItem } from '../../types/trading';
import { Layers3D, Chart3D, Completed3D, Cancel3D } from '../ui/icons3d';

export interface OrderStatsCardsProps {
  orders: OrderItem[];
}

export const OrderStatsCards: React.FC<OrderStatsCardsProps> = ({ orders }) => {
  const total = orders.length;
  const active = orders.filter((o) => o.status === 'Active' || o.status === 'Pending').length;
  const filled = orders.filter((o) => o.status === 'Filled').length;
  const cancelled = orders.filter((o) => o.status === 'Cancelled' || o.status === 'Rejected').length;

  const stats = [
    {
      label: 'Total Orders',
      value: total,
      subtext: 'All recorded paper orders',
      icon3d: <Layers3D size={36} />,
    },
    {
      label: 'Active Orders',
      value: active,
      subtext: 'Open & pending in market',
      icon3d: <Chart3D size={36} />,
    },
    {
      label: 'Filled Orders',
      value: filled,
      subtext: 'Successfully executed',
      icon3d: <Completed3D size={36} />,
    },
    {
      label: 'Cancelled Orders',
      value: cancelled,
      subtext: 'Cancelled or rejected',
      icon3d: <Cancel3D size={36} />,
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
            <span className="text-2xl font-bold text-brand-text font-mono tracking-tight">
              {stat.value}
            </span>
            <p className="text-[11px] text-brand-muted mt-1 font-normal">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
