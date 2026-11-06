import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import {
  Bell3D,
  Completed3D,
  Warning3D,
  Server3D,
  TrendingUp3D,
} from '../ui/icons3d';
import { useTradingContext } from '../../context/TradingContext';
import type { NotificationItem } from '../../types/trading';

export interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuToggle }) => {
  const location = useLocation();
  const { marketOpen } = useTradingContext();
  // TODO: wire to real notification source (none yet)
  const notifications: NotificationItem[] = [];
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive dynamic page title and breadcrumb based on current pathname
  const getPageMeta = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/overview':
        return { title: 'Overview', breadcrumb: 'Dashboard / Overview' };
      case '/orders':
        return { title: 'Orders', breadcrumb: 'Dashboard / Orders' };
      case '/history':
        return { title: 'Trade History', breadcrumb: 'Dashboard / Trade History' };
      case '/settings':
        return { title: 'Settings', breadcrumb: 'Dashboard / Settings' };
      default:
        return { title: 'Dashboard', breadcrumb: 'Dashboard' };
    }
  };

  const { title, breadcrumb } = getPageMeta(location.pathname);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Completed3D size={18} />;
      case 'warning':
        return <Warning3D size={18} />;
      default:
        return <Server3D size={18} />;
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/85 backdrop-blur-xl border-b border-brand-border shrink-0 shadow-xs transition-colors"
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Left side: Hamburger (mobile/tablet) + Breadcrumb + Dynamic Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 -ml-1.5 text-brand-muted hover:text-brand-sidebar hover:bg-pink-50 rounded-lg lg:hidden transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-brand-muted">
            <span>{breadcrumb}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-brand-text tracking-tight leading-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Right side: Status indicators, Notification bell, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Market Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 shadow-sm">
          <TrendingUp3D size={18} />
          <span>{marketOpen ? 'Market Open' : 'Market Closed'}</span>
        </div>

        {/* 3D Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-brand-muted hover:text-brand-sidebar hover:bg-brand-subtle transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 active:scale-95 group"
            aria-label="Notifications"
          >
            <Bell3D size={24} className="group-hover:scale-105 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* 3D Notifications Popover */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-brand-border shadow-2xl z-50 p-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <Bell3D size={20} />
                    <span className="text-xs font-bold text-brand-text">Notifications</span>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-primary bg-pink-100 border border-pink-200 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
                <div className="mt-2.5 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 && (
                    <p className="text-[11px] text-brand-muted text-center py-4">No notifications yet</p>
                  )}
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-brand-bg/60 hover:bg-pink-50/40 transition-colors border border-brand-border/60 text-xs flex items-start gap-2.5"
                    >
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-brand-text block truncate">
                          {item.title}
                        </span>
                        <p className="text-[11px] text-brand-muted mt-0.5 leading-snug">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-brand-muted/70 block mt-1 font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

