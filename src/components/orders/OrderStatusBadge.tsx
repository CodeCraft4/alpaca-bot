import React from 'react';
import type { OrderStatus, OrderSide } from '../../types/trading';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const statusColors: Record<OrderStatus, string> = {
    Active: 'text-brand-primary font-semibold',
    Pending: 'text-amber-600 font-semibold',
    Filled: 'text-emerald-600 font-semibold',
    Cancelled: 'text-gray-500 font-medium',
    Rejected: 'text-brand-danger font-semibold',
  };

  const statusDots: Record<OrderStatus, string> = {
    Active: 'bg-brand-primary animate-pulse',
    Pending: 'bg-amber-500 animate-pulse',
    Filled: 'bg-emerald-500',
    Cancelled: 'bg-gray-400',
    Rejected: 'bg-brand-danger',
  };

  const textSize = size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} ${statusColors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDots[status]}`} />
      <span>{status}</span>
    </span>
  );
};

export interface OrderSideBadgeProps {
  side: OrderSide;
}

export const OrderSideBadge: React.FC<OrderSideBadgeProps> = ({ side }) => {
  const isBuy = side === 'Buy';
  return (
    <span
      className={`text-xs font-bold tracking-wide ${
        isBuy ? 'text-emerald-600' : 'text-brand-primary'
      }`}
    >
      {side.toUpperCase()}
    </span>
  );
};
