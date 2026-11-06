import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SummaryStatCardProps {
  label: string;
  value: string;
  subtext?: string;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  icon3d?: React.ReactNode;
}

export const SummaryStatCard: React.FC<SummaryStatCardProps> = ({
  label,
  value,
  subtext,
  change,
  isPositive,
  icon: Icon,
  iconColor = 'text-brand-primary',
  icon3d,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-muted tracking-wide">{label}</span>
        {icon3d ? (
          <div className="p-1 rounded-2xl bg-gradient-to-br from-pink-50/80 via-transparent to-pink-100/50 dark:from-pink-950/40 dark:to-pink-900/20 border border-brand-border/70 shadow-sm group-hover:scale-105 transition-transform duration-200">
            {icon3d}
          </div>
        ) : Icon ? (
          <div className="p-2 rounded-xl bg-pink-50/80 border border-brand-border/60">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold text-brand-text font-mono tracking-tight">
            {value}
          </span>
          {change && (
            <span
              className={`inline-flex items-center text-xs font-bold ${
                isPositive ? 'text-brand-success' : 'text-brand-danger'
              }`}
            >
              {change}
            </span>
          )}
        </div>

        {subtext && (
          <p className="text-[11px] text-brand-muted mt-1.5 font-normal">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
