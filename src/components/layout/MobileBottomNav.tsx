import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTradingContext } from '../../context/TradingContext';
import {
  Overview3D,
  Layers3D,
  History3D,
  Settings3D,
} from '../ui/icons3d';

interface MobileTabItem {
  name: string;
  path: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  showBadge?: boolean;
}

export const MobileBottomNav: React.FC = () => {
  const { orders } = useTradingContext();

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'Active' || o.status === 'Pending'
  ).length;

  const tabs: MobileTabItem[] = [
    {
      name: 'Overview',
      path: '/',
      renderIcon: () => <Overview3D size={20} />,
    },
    {
      name: 'Orders',
      path: '/orders',
      renderIcon: () => <Layers3D size={20} />,
      showBadge: activeOrdersCount > 0,
    },
    {
      name: 'History',
      path: '/history',
      renderIcon: () => <History3D size={20} />,
    },
    {
      name: 'Settings',
      path: '/settings',
      renderIcon: () => <Settings3D size={20} />,
    },
  ];

  return (
    <nav
      className="fixed bottom-4 sm:bottom-6 left-4 right-4 max-w-sm mx-auto z-40 lg:hidden rounded-full bg-white/80 backdrop-blur-2xl backdrop-saturate-200 border border-pink-200/70 shadow-[0_12px_36px_rgba(219,39,119,0.18),0_4px_14px_rgba(0,0,0,0.06)] px-2 py-1.5"
      style={{ WebkitBackdropFilter: 'blur(24px) saturate(200%)' }}
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-4 h-12 items-center">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `group relative flex flex-col items-center justify-center py-0.5 px-1 rounded-full transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-brand-primary font-bold'
                  : 'text-brand-muted hover:text-brand-text font-medium opacity-85'
              }`
            }
          >
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center justify-center w-full py-1 px-1.5 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-pink-100/70 shadow-xs' : 'hover:bg-pink-50/40'
                }`}
              >
                {/* Icon Wrapper with Badge */}
                <div className="relative">
                  <div
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-105 drop-shadow-xs' : 'scale-95'
                    }`}
                  >
                    {tab.renderIcon(isActive)}
                  </div>

                  {/* Active Orders Badge */}
                  {tab.showBadge && (
                    <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-brand-primary text-white text-[8px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
                      {activeOrdersCount}
                    </span>
                  )}
                </div>

                {/* Minimal Tab Label */}
                <span
                  className={`text-[9px] tracking-tight mt-0.5 transition-colors leading-none ${
                    isActive ? 'text-brand-primary font-bold' : 'text-brand-muted'
                  }`}
                >
                  {tab.name}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
