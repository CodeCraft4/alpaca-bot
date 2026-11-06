import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import type { TradingSettingsState } from '../../types/settings';
import {
  Cpu3D,
  Target3D,
  Shield3D,
  Calendar3D,
} from '../ui/icons3d';

export interface AutomationPreferencesProps {
  settings: TradingSettingsState;
  onUpdate: (partial: Partial<TradingSettingsState>) => void;
  onShowToast: (msg: string) => void;
}

export const AutomationPreferences: React.FC<AutomationPreferencesProps> = ({
  settings,
  onUpdate,
  onShowToast,
}) => {
  const handleToggle = (key: keyof TradingSettingsState, label: string) => {
    if (key === 'manualBuyOnly') {
      onShowToast('Manual Buy Only is locked for safety. Automated buy orders are prohibited.');
      return;
    }
    const nextVal = !settings[key];
    onUpdate({ [key]: nextVal });
    onShowToast(`${label} ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
          <Cpu3D size={32} />
          <div>
            <h2 className="text-base font-bold text-brand-text">Automation Preferences</h2>
            <p className="text-xs text-brand-muted">
              Configure bot automated execution boundaries and decision gates.
            </p>
          </div>
        </div>

        {/* Toggle List */}
        <div className="mt-5 space-y-4">
          {/* Automatic Profit Target Exit */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-brand-bg/40 border border-brand-border/60">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <Target3D size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-text block">
                  Automatic Profit Target Exit
                </span>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  When active, the bot automatically submits a simulated limit order upon reaching your target profit.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoProfitTargetExit}
              onClick={() => handleToggle('autoProfitTargetExit', 'Automatic Profit Target Exit')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent/20 ${
                settings.autoProfitTargetExit ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoProfitTargetExit ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Automatic Stop Loss Exit */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-brand-bg/40 border border-brand-border/60">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <Shield3D size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-text block">
                  Automatic Stop Loss Exit
                </span>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  Automatically submits a defensive stop order when a position drops below the maximum loss threshold.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoStopLossExit}
              onClick={() => handleToggle('autoStopLossExit', 'Automatic Stop Loss Exit')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent/20 ${
                settings.autoStopLossExit ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoStopLossExit ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Manual Buy Only — Locked */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-pink-50/50 border border-pink-200/60">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <Shield3D size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-brand-text">
                    Manual Buy Only
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-brand-border text-brand-sidebar">
                    <Lock className="w-2.5 h-2.5" />
                    Locked ON
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  The algorithm is strictly prohibited from opening new buy orders autonomously. All buy entries require manual user authorization.
                </p>
              </div>
            </div>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-brand-primary/70 border-2 border-transparent">
              <span className="inline-block h-5 w-5 transform translate-x-5 rounded-full bg-white shadow" />
            </div>
          </div>

          {/* Holding Period Review Reminder */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-brand-bg/40 border border-brand-border/60">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                <Calendar3D size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-text block">
                  Holding Period Review Reminder
                </span>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                  Sends a decision prompt when a position reaches the review interval (3 days). Note: This reminder will never automatically close or liquidate your position.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.holdingPeriodReminder}
              onClick={() => handleToggle('holdingPeriodReminder', 'Holding Period Reminder')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent/20 ${
                settings.holdingPeriodReminder ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.holdingPeriodReminder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info Notice */}
      <div className="mt-5 pt-3 border-t border-brand-border/60 flex items-start gap-1.5 text-[10px] text-brand-muted leading-tight">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-brand-primary mt-0.5" />
        <span>
          These switches are saved in your database and read by the backend worker. The worker checks positions every minute. Right now it only LOGS exits (dry-run); automatic selling stays off until it is enabled on the server.
        </span>
      </div>
    </div>
  );
};

