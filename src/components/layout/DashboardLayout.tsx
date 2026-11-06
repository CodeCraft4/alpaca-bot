import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { BackendBanner } from './BackendBanner';

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-brand-bg text-brand-text">
      {/* Sidebar: Fixed 100dvh, non-scrollable, remains stationary while main content scrolls */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area: Independently scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden relative">
        {/* Dynamic Header */}
        <DashboardHeader onMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Scrollable Viewport - with bottom padding on mobile for floating bottom navigation */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-brand-bg focus:outline-none pb-24 lg:pb-0"
          tabIndex={-1}
        >
          <BackendBanner />
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation with frosted glass blur */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

