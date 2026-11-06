import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'paper' | 'success' | 'danger' | 'warning' | 'neutral' | 'sidebar';
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    paper: 'text-brand-primary font-semibold',
    sidebar: 'text-pink-100 font-semibold',
    success: 'text-emerald-600 font-semibold',
    danger: 'text-brand-danger font-semibold',
    warning: 'text-amber-600 font-semibold',
    neutral: 'text-brand-muted font-medium',
  };

  const dotStyles = {
    paper: 'bg-brand-primary',
    sidebar: 'bg-pink-300',
    success: 'bg-emerald-500 animate-pulse',
    danger: 'bg-red-500',
    warning: 'bg-amber-500 animate-pulse',
    neutral: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors select-none text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
};
