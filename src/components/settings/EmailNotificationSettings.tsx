import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import type { TradingSettingsState } from '../../types/settings';
import { api } from '../../lib/api';
import {
  Mail3D,
  Completed3D,
  Target3D,
  Shield3D,
  Layers3D,
  Warning3D,
  Chart3D,
} from '../ui/icons3d';

export interface EmailNotificationSettingsProps {
  settings: TradingSettingsState;
  onUpdate: (partial: Partial<TradingSettingsState>) => void;
  onShowToast: (msg: string) => void;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  settings,
  onUpdate,
  onShowToast,
}) => {
  const [email, setEmail] = useState<string>(settings.recipientEmail);
  const [emailError, setEmailError] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(val)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) validateEmail(val);
    onUpdate({ recipientEmail: val });
  };

  const handleCheckboxToggle = (key: keyof TradingSettingsState['notifications']) => {
    const updated = {
      ...settings.notifications,
      [key]: !(settings.notifications[key] ?? true),
    };
    onUpdate({ notifications: updated });
  };

  const handleSendTestEmail = async () => {
    if (!validateEmail(email)) return;
    setIsTesting(true);
    try {
      const r = await api<{ sent: boolean; to?: string; reason?: string }>('/notifications/test', { method: 'POST', body: '{}' });
      if (r.sent) {
        setTestSent(true);
        onShowToast(`Test email sent to ${r.to ?? email}. Check your inbox (and spam).`);
        setTimeout(() => setTestSent(false), 3000);
      } else {
        onShowToast(`Email not sent: ${r.reason ?? 'unknown reason'}.`);
      }
    } catch (e) {
      onShowToast(`Email failed: ${(e as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const notificationOptions = [
    { key: 'orderPlaced', label: 'Buy order placed', renderIcon: () => <Chart3D size={16} /> },
    { key: 'profitTargetFilled', label: 'Sold: profit target hit', renderIcon: () => <Target3D size={16} /> },
    { key: 'stopLossFilled', label: 'Sold: stop loss hit', renderIcon: () => <Shield3D size={16} /> },
    { key: 'manualSellFilled', label: 'Sold manually by you', renderIcon: () => <Layers3D size={16} /> },
    { key: 'orderRejected', label: 'Order rejected', renderIcon: () => <Warning3D size={16} /> },
  ] as const;

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header with Main Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <Mail3D size={32} />
            <div>
              <h2 className="text-base font-bold text-brand-text">Email Notifications</h2>
              <p className="text-xs text-brand-muted">
                Receive instant execution alerts and daily performance summaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-text hidden sm:inline">
              {settings.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.emailNotificationsEnabled}
              onClick={() => {
                const nextVal = !settings.emailNotificationsEnabled;
                onUpdate({ emailNotificationsEnabled: nextVal });
                onShowToast(`Email notifications ${nextVal ? 'enabled' : 'disabled'}.`);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent/20 ${settings.emailNotificationsEnabled ? 'bg-brand-primary' : 'bg-gray-200'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div
          className={`mt-5 space-y-4 transition-opacity duration-200 ${settings.emailNotificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
        >
          {/* Email input + Test button */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Recipient Email Address
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  disabled={!settings.emailNotificationsEnabled}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  placeholder="you@example.com"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/20 ${emailError
                    ? 'border-brand-danger bg-red-50/30'
                    : 'border-brand-border bg-brand-bg/40 focus:border-brand-primary'
                    }`}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSendTestEmail()}
                disabled={!settings.emailNotificationsEnabled || isTesting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-text hover:text-brand-primary hover:border-pink-300 shadow-sm transition-all disabled:opacity-50 shrink-0 active:scale-95"
              >
                {testSent ? (
                  <>
                    <Completed3D size={16} />
                    <span className="text-emerald-600 font-bold">Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className={`w-3.5 h-3.5 text-brand-primary ${isTesting ? 'animate-bounce' : ''}`} />
                    <span>{isTesting ? 'Sending...' : 'Test Email'}</span>
                  </>
                )}
              </button>
            </div>
            {emailError && (
              <p className="text-[11px] text-brand-danger mt-1 font-medium">{emailError}</p>
            )}
          </div>

          {/* Checkboxes List */}
          <div>
            <span className="block text-xs font-semibold text-brand-text mb-2">
              Notification Events
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {notificationOptions.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-brand-border/60 bg-brand-bg/30 hover:bg-brand-bg/60 cursor-pointer transition-colors text-xs text-brand-text"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{opt.renderIcon()}</span>
                    <span>{opt.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications[opt.key] ?? true}
                    disabled={!settings.emailNotificationsEnabled}
                    onChange={() => handleCheckboxToggle(opt.key)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-accent/20 border-brand-border accent-brand-primary cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-5 pt-3 border-t border-brand-border/60 flex items-start gap-1.5 text-[10px] text-brand-muted leading-tight">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-brand-muted mt-0.5" />
        <span>
          Emails are sent for: a buy order placed, a position sold (target / stop / manual, with the profit or loss), a rejected order, and the holding-review reminder after your review days.
        </span>
      </div>
    </div>
  );
};
