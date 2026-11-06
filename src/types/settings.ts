export interface TradingSettingsState {
  profitTargetPct: number;
  stopLossPct: number;
  holdingReviewDays: number;

  autoProfitTargetExit: boolean;
  autoStopLossExit: boolean;
  manualBuyOnly: boolean;
  holdingPeriodReminder: boolean;

  emailNotificationsEnabled: boolean;
  recipientEmail: string;
  notifications: {
    orderPlaced?: boolean;
    orderFilled?: boolean;
    profitTargetFilled: boolean;
    stopLossFilled: boolean;
    manualSellFilled: boolean;
    orderRejected: boolean;
    dailySummary: boolean;
  };

  emergencyKillSwitch: boolean;
}

// Placeholder defaults only; the backend (Supabase) is the source of truth for settings.
export const DEFAULT_SETTINGS: TradingSettingsState = {
  profitTargetPct: 3,
  stopLossPct: 5,
  holdingReviewDays: 3,

  autoProfitTargetExit: true,
  autoStopLossExit: true,
  manualBuyOnly: true,
  holdingPeriodReminder: true,

  emailNotificationsEnabled: true,
  recipientEmail: '',
  notifications: {
    profitTargetFilled: true,
    stopLossFilled: true,
    manualSellFilled: true,
    orderRejected: true,
    dailySummary: false,
  },

  emergencyKillSwitch: false,
};

