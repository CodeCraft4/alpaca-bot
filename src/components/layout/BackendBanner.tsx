import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';

/** Visible warning when the dashboard cannot talk to the backend (instead of an empty or broken page). */
export const BackendBanner: React.FC = () => {
  const { backendError, isConnecting } = useTradingContext();
  if (!backendError || isConnecting) return null;
  return (
    <div role="alert" className="mx-4 sm:mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">Cannot reach the backend</p>
        <p className="mt-0.5 break-words">{backendError}</p>
      </div>
    </div>
  );
};
