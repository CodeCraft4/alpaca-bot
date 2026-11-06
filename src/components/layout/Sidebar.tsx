import React from 'react';
import { X } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { SidebarNavigation } from './SidebarNavigation';
import { Badge3D } from '../ui/icons3d';
import { SidebarStatus } from './SidebarStatus';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container: Exactly 100dvh, non-scrollable, dark-pink background */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 h-[100dvh] bg-brand-sidebar text-white shadow-xl transition-transform duration-300 ease-in-out overflow-hidden select-none lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding Section */}
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Badge3D size={28} />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                  ABNB Trader
                </h1>
                <p className="text-[10px] uppercase font-semibold text-pink-200/80 tracking-widest">
                  Assistant
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-pink-200 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <StatusBadge label="PAPER TRADING" variant="sidebar" size="sm" dot />
            <span className="text-[10px] text-pink-200/70 font-mono">SIMULATION</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-hidden flex flex-col justify-between py-2">
          <SidebarNavigation onItemClick={onClose} />

          {/* Bottom Connection Status & Profile Section */}
          <div className="shrink-0 px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
            {/* System connection indicators (live from backend) */}
            <SidebarStatus />

          </div>
        </div>
      </aside>
    </>
  );
};

