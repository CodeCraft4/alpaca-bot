import React, { useState } from 'react';
import { PauseCircle, PlayCircle, ShieldAlert } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { Error3D } from '../ui/icons3d';

export interface DangerZoneProps {
  killSwitchActive: boolean;
  onToggleKillSwitch: (active: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  killSwitchActive,
  onToggleKillSwitch,
  onShowToast,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleToggleClick = () => {
    if (!killSwitchActive) {
      // Prompt confirmation before enabling emergency pause
      setShowConfirmModal(true);
    } else {
      // Disabling emergency pause (resuming)
      onToggleKillSwitch(false);
      onShowToast('Automated trading operations resumed (Simulated).');
    }
  };

  const handleConfirmKillSwitch = () => {
    onToggleKillSwitch(true);
    onShowToast('Emergency Kill Switch activated! Automated trading paused.');
  };

  return (
    <>
      <div className="bg-red-50/20 rounded-2xl border border-red-200 shadow-card p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-red-200">
            <Error3D size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-red-950">Danger Zone</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-danger uppercase">
                  High Impact
                </span>
              </div>
              <p className="text-xs text-red-700/80">
                Safeguards and emergency fail-safe controls.
              </p>
            </div>
          </div>

          {/* Kill Switch Toggle Control */}
          <div className="mt-5 p-4 rounded-xl bg-white border border-red-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {killSwitchActive ? (
                  <PauseCircle className="w-4 h-4 text-brand-danger" />
                ) : (
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                )}
                <span className="text-xs font-bold text-brand-text">
                  Pause Automated Trading (Kill Switch)
                </span>
              </div>
              <p className="text-[11px] text-brand-muted max-w-xl leading-relaxed">
                In the production system, this should prevent new automated exit orders from being submitted. Manual account access should remain available.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  killSwitchActive
                    ? 'bg-red-100 text-brand-danger border-red-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {killSwitchActive ? 'PAUSED' : 'ACTIVE'}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={killSwitchActive}
                onClick={handleToggleClick}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  killSwitchActive ? 'bg-brand-danger' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    killSwitchActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Status Warning Banner when Enabled */}
          {killSwitchActive && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-100/80 border border-red-300 text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 shrink-0 text-brand-danger mt-0.5" />
              <div>
                <span className="font-bold block">Automated Trading Paused (Simulated)</span>
                All automated exit rules, profit targets, and stop losses are frozen in mock memory.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-red-200 text-[10px] text-red-700/70">
          Saved on the backend. While ON: new BUY orders and the automation worker are blocked. Selling manually always still works.
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Activate Emergency Kill Switch?"
        description="This blocks all new BUY orders and stops the automation worker. You can still sell manually. Are you sure you wish to proceed?"
        confirmText="Yes, Pause Trading"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmKillSwitch}
        onClose={() => setShowConfirmModal(false)}
      />
    </>
  );
};

