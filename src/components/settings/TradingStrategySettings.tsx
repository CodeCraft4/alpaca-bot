import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { TradingSettingsState } from '../../types/settings';
import {
  Settings3D,
  Target3D,
  Calendar3D,
  Completed3D,
} from '../ui/icons3d';

export interface TradingStrategySettingsProps {
  settings: TradingSettingsState;
  onUpdate: (partial: Partial<TradingSettingsState>) => void;
  onShowToast: (msg: string) => void;
}

export const TradingStrategySettings: React.FC<TradingStrategySettingsProps> = ({
  settings,
  onUpdate,
  onShowToast,
}) => {
  const [profitTarget, setProfitTarget] = useState<number>(settings.profitTargetPct);
  const [holdingDays, setHoldingDays] = useState<number>(settings.holdingReviewDays);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      profitTargetPct: profitTarget,
      holdingReviewDays: holdingDays,
    });
    setIsSaved(true);
    onShowToast('Trading strategy parameters updated successfully.');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
          <Settings3D size={32} />
          <div>
            <h2 className="text-base font-bold text-brand-text">Trading Strategy</h2>
            <p className="text-xs text-brand-muted">
              Define baseline profit parameters and capital allocation limits.
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Profit Target */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                  <Target3D size={16} />
                  <span>Default profit target %</span>
                </label>
                <span title="Default target applied when creating a new position." className="cursor-help text-brand-muted">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-bg/40 text-xs font-mono font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-muted">
                  %
                </span>
              </div>
              <p className="text-[11px] text-brand-muted mt-1">
                Default target applied when creating a new position.
              </p>
            </div>

            {/* Maximum Holding Review Period */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                  <Calendar3D size={16} />
                  <span>Review interval</span>
                </label>
                <span title="Ask for a holding decision when this period is reached." className="cursor-help text-brand-muted">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="30"
                  value={holdingDays}
                  onChange={(e) => setHoldingDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-bg/40 text-xs font-mono font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-primary transition-all"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-muted">
                  days
                </span>
              </div>
              <p className="text-[11px] text-brand-muted mt-1">
                Ask for a holding decision when this period is reached.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-brand-border flex items-center justify-between">
            <span className="text-[11px] text-brand-muted">
              Saved to your database (Supabase)
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-sidebar transition-colors shadow-sm active:scale-95"
            >
              {isSaved ? (
                <>
                  <Completed3D size={16} />
                  <span>Changes Saved</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

