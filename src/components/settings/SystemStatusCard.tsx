import React from 'react';
import { useHealth } from '../../lib/useHealth';
import {
  Server3D,
  Shield3D,
  Radio3D,
  TrendingUp3D,
  Database3D,
} from '../ui/icons3d';

export const SystemStatusCard: React.FC = () => {
  const { health, offline } = useHealth();

  const alpacaEnv = health?.env ?? 'paper';
  const alpacaOk = health?.alpaca === 'ok';
  const dbOk = health?.database === 'ok';
  const serverLabel = offline ? 'Backend offline' : health ? 'Backend online' : 'Checking…';
  const okBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  const badBadge = 'bg-amber-50 text-amber-700 border-amber-200';

  const statuses = [
    {
      label: 'Trading Mode',
      value: alpacaEnv === 'paper' ? 'Paper Trading (Simulation)' : 'Live Trading (Real Funds)',
      detail: 'ABNB Automated Bot',
      badgeClass: 'bg-pink-100 text-brand-primary border-pink-200',
      dotClass: 'bg-brand-primary animate-pulse',
      renderIcon: () => <Shield3D size={20} />,
    },
    {
      label: 'Backend API',
      value: serverLabel,
      detail: 'localhost:4555',
      badgeClass: health ? okBadge : badBadge,
      dotClass: health ? 'bg-emerald-500' : 'bg-amber-500',
      renderIcon: () => <Radio3D size={20} />,
    },
    {
      label: 'Alpaca Connection',
      value: alpacaOk ? 'Connected' : health?.alpaca ?? 'Unknown',
      detail: 'Trading + market data',
      badgeClass: alpacaOk ? okBadge : badBadge,
      dotClass: alpacaOk ? 'bg-emerald-500' : 'bg-amber-500',
      renderIcon: () => <Server3D size={20} />,
    },
    {
      label: 'Supabase Database',
      value: dbOk ? 'Connected (Online)' : health?.database ?? 'Unknown',
      detail: 'Orders, trades, settings',
      badgeClass: dbOk ? okBadge : badBadge,
      dotClass: dbOk ? 'bg-emerald-500' : 'bg-amber-500',
      renderIcon: () => <Database3D size={20} />,
    },
    {
      label: 'Market Analysis',
      value: health?.analysis ?? 'Unknown',
      detail: 'AI provider (server-side)',
      badgeClass: health?.analysis ? okBadge : badBadge,
      dotClass: health?.analysis ? 'bg-emerald-500' : 'bg-amber-500',
      renderIcon: () => <TrendingUp3D size={20} />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header with Live Heartbeat Pill */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <Server3D size={32} />
            <div>
              <h2 className="text-base font-bold text-brand-text">System Status & Environment</h2>
              <p className="text-xs text-brand-muted">
                Live status reported by the backend server.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{health ? 'Backend connected' : 'Waiting for backend'}</span>
          </div>
        </div>

        {/* Statuses Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {statuses.map((item) => (
            <div
              key={item.label}
              className="p-3.5 rounded-xl bg-brand-bg/50 border border-brand-border/60 flex flex-col justify-between gap-2.5 hover:border-pink-200 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-brand-text font-bold truncate">
                  <span className="shrink-0">{item.renderIcon()}</span>
                  <span className="truncate text-xs">{item.label}</span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${item.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotClass}`} />
                  <span className="truncate max-w-[130px] sm:max-w-[150px]">{item.value}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-muted border-t border-brand-border/40 pt-1.5 font-mono">
                <span>{item.detail}</span>
                <span className="text-[10px] text-emerald-600 font-semibold font-sans">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mt-5 pt-3 border-t border-brand-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-brand-muted gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Secrets live only on the backend server</span>
        </div>
      </div>
    </div>
  );
};
