import React from 'react';
import { CheckCircle2, Sliders, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import { History3D } from '../ui/icons3d';

export const RecentActivityList: React.FC = () => {
  const { recentActivities } = useTradingContext();

  const getIcon = (type: string, title: string) => {
    if (title.includes('Buy') || title.includes('Opened')) {
      return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
    }
    if (type === 'config') {
      return <Sliders className="w-4 h-4 text-brand-primary" />;
    }
    if (type === 'system') {
      return <ShieldCheck className="w-4 h-4 text-blue-600" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-brand-primary" />;
  };

  const getBadgeStyle = (badgeColor?: string) => {
    switch (badgeColor) {
      case 'emerald':
        return 'text-emerald-600 font-bold';
      case 'pink':
        return 'text-brand-primary font-bold';
      case 'blue':
        return 'text-blue-600 font-bold';
      default:
        return 'text-brand-muted font-medium';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6">
      <div className="flex items-center justify-between pb-3 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <History3D size={26} />
          <div>
            <h2 className="text-base font-bold text-brand-text">Recent Activity</h2>
            <p className="text-xs text-brand-muted">Latest bot triggers & simulation events</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-brand-muted">Live Stream</span>
      </div>

      <div className="mt-4 divide-y divide-brand-border/60">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 hover:bg-pink-50/20 px-1 rounded-xl transition-colors"
          >
            <div className="p-2 rounded-xl bg-brand-bg border border-brand-border shrink-0 mt-0.5">
              {getIcon(activity.type, activity.title)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-brand-text truncate">
                  {activity.title}
                </p>
                <span className="text-[10px] text-brand-muted font-mono shrink-0">
                  {activity.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-brand-muted mt-0.5 truncate">
                {activity.detail}
              </p>
            </div>

            <span
              className={`hidden sm:inline-flex text-[10px] font-bold shrink-0 ${getBadgeStyle(
                activity.badgeColor
              )}`}
            >
              {activity.type.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

