import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Overview3D,
  Layers3D,
  History3D,
  Settings3D,
} from '../ui/icons3d';

export interface NavItem {
  name: string;
  path: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    path: '/',
    renderIcon: () => <Overview3D size={22} />,
  },
  {
    name: 'Orders',
    path: '/orders',
    renderIcon: () => <Layers3D size={22} />,
  },
  {
    name: 'Trade History',
    path: '/history',
    renderIcon: () => <History3D size={22} />,
  },
  {
    name: 'Settings',
    path: '/settings',
    renderIcon: () => <Settings3D size={22} />,
  },
];

interface SidebarNavigationProps {
  onItemClick?: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ onItemClick }) => {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1.5" aria-label="Sidebar Navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={onItemClick}
          className={({ isActive }) =>
            `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
              isActive
                ? 'bg-white text-brand-sidebar shadow-md font-semibold'
                : 'text-pink-100 hover:text-white hover:bg-white/10'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-3">
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105 opacity-90'}`}>
                  {item.renderIcon(isActive)}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-pink-100 text-brand-sidebar' : 'bg-white/20 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
