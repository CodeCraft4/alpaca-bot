import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { OverviewPage } from '../pages/OverviewPage';
import { OrdersPage } from '../pages/OrdersPage';
import { TradeHistoryPage } from '../pages/TradeHistoryPage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="history" element={<TradeHistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

