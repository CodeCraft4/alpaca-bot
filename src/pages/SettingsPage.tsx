import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import type { TradingSettingsState } from '../types/settings';
import { TradingStrategySettings } from '../components/settings/TradingStrategySettings';
import { AutomationPreferences } from '../components/settings/AutomationPreferences';
import { PositionReviewRules } from '../components/settings/PositionReviewRules';
import { EmailNotificationSettings } from '../components/settings/EmailNotificationSettings';
import { SystemStatusCard } from '../components/settings/SystemStatusCard';
import { DangerZone } from '../components/settings/DangerZone';
import { ConfirmationModal } from '../components/settings/ConfirmationModal';
import { useTradingContext } from '../context/TradingContext';
import { Settings3D, Completed3D } from '../components/ui/icons3d';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useTradingContext();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleUpdateSettings = (partial: Partial<TradingSettingsState>) => {
    updateSettings(partial);
  };

  const handleResetToDefaults = () => {
    resetSettings();
    showToast('All parameters have been reset to default values.');
  };

  return (
    <PageContainer
      title="Settings"
      description="Configure your paper trading preferences and account notifications."
      action={
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-muted hover:text-brand-sidebar hover:border-pink-300 shadow-sm transition-all active:scale-95"
          >
            <Settings3D size={16} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-brand-sidebar text-white text-xs font-semibold shadow-2xl border border-white/20 animate-in slide-in-from-bottom-5 duration-200">
          <Completed3D size={20} />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-pink-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* 1 & 2. Trading Strategy & Automation Preferences */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradingStrategySettings
            settings={settings}
            onUpdate={handleUpdateSettings}
            onShowToast={showToast}
          />
          <AutomationPreferences
            settings={settings}
            onUpdate={handleUpdateSettings}
            onShowToast={showToast}
          />
        </section>

        {/* 3. Position Review Rules Visual Architecture */}
        <section>
          <PositionReviewRules />
        </section>

        {/* 4 & 5. Email Notifications & System Status */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmailNotificationSettings
            settings={settings}
            onUpdate={handleUpdateSettings}
            onShowToast={showToast}
          />
          <SystemStatusCard />
        </section>

        {/* 6. Danger Zone */}
        <section>
          <DangerZone
            killSwitchActive={settings.emergencyKillSwitch}
            onToggleKillSwitch={(active) =>
              handleUpdateSettings({ emergencyKillSwitch: active })
            }
            onShowToast={showToast}
          />
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset All Settings to Defaults?"
        description="This will restore all profit targets (3%), stop losses (5%), investment limits ($50), and automation options to their initial baseline configurations. Session modifications will be discarded."
        confirmText="Reset to Defaults"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleResetToDefaults}
        onClose={() => setShowResetModal(false)}
      />
    </PageContainer>
  );
};

export default SettingsPage;
