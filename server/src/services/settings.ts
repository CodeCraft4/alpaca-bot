import { z } from 'zod';
import { query } from '../db.js';
import { config } from '../config.js';
import { logActivity } from './activity.js';

export interface Settings {
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
    profitTargetFilled: boolean;
    stopLossFilled: boolean;
    manualSellFilled: boolean;
    orderRejected: boolean;
    dailySummary: boolean;
    orderPlaced?: boolean;
    orderFilled?: boolean;
  };
  emergencyKillSwitch: boolean;
}

export const settingsPatchSchema = z
  .object({
    profitTargetPct: z.number().positive().max(100),
    stopLossPct: z.number().min(0).max(100), // 0 = no stop-loss
    holdingReviewDays: z.number().int().positive().max(365),
    autoProfitTargetExit: z.boolean(),
    autoStopLossExit: z.boolean(),
    manualBuyOnly: z.boolean(),
    holdingPeriodReminder: z.boolean(),
    emailNotificationsEnabled: z.boolean(),
    recipientEmail: z.string().max(200),
    notifications: z
      .object({
        profitTargetFilled: z.boolean(),
        stopLossFilled: z.boolean(),
        manualSellFilled: z.boolean(),
        orderRejected: z.boolean(),
        dailySummary: z.boolean(),
        orderPlaced: z.boolean(),
        orderFilled: z.boolean(),
      })
      .partial(),
    emergencyKillSwitch: z.boolean(),
  })
  .partial()
  .strict();

const toSettings = (r: any): Settings => ({
  profitTargetPct: Number(r.profit_target_pct),
  stopLossPct: Number(r.stop_loss_pct),
  holdingReviewDays: r.holding_review_days,
  autoProfitTargetExit: r.auto_profit_target_exit,
  autoStopLossExit: r.auto_stop_loss_exit,
  manualBuyOnly: r.manual_buy_only,
  holdingPeriodReminder: r.holding_period_reminder,
  emailNotificationsEnabled: r.email_notifications_enabled,
  recipientEmail: r.recipient_email || config.ALERT_NOTIFICATION_EMAIL,
  notifications: r.notifications,
  emergencyKillSwitch: r.emergency_kill_switch,
});

let cache: { at: number; value: Settings } | null = null;
const CACHE_MS = 5_000;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = await loadSettings();
  cache = { at: Date.now(), value };
  return value;
}

async function loadSettings(): Promise<Settings> {
  let rows = await query('select * from settings where id = 1');
  if (!rows.length) {
    // First run: seed from env defaults.
    rows = await query(
      `insert into settings (id, profit_target_pct, stop_loss_pct, holding_review_days, recipient_email)
       values (1,$1,$2,$3,$4) on conflict (id) do update set id = 1 returning *`,
      [
        config.DEFAULT_PROFIT_TARGET_PCT,
        config.DEFAULT_STOP_LOSS_PCT,
        config.HOLDING_REVIEW_DAYS,
        config.ALERT_NOTIFICATION_EMAIL,
      ],
    );
  }
  return toSettings(rows[0]);
}

const COLS: Record<string, string> = {
  profitTargetPct: 'profit_target_pct',
  stopLossPct: 'stop_loss_pct',
  holdingReviewDays: 'holding_review_days',
  autoProfitTargetExit: 'auto_profit_target_exit',
  autoStopLossExit: 'auto_stop_loss_exit',
  manualBuyOnly: 'manual_buy_only',
  holdingPeriodReminder: 'holding_period_reminder',
  emailNotificationsEnabled: 'email_notifications_enabled',
  recipientEmail: 'recipient_email',
  emergencyKillSwitch: 'emergency_kill_switch',
};

export async function updateSettings(patch: z.infer<typeof settingsPatchSchema>): Promise<Settings> {
  cache = null;
  const current = await getSettings();
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'notifications') continue;
    sets.push(`${COLS[k]} = $${vals.length + 1}`);
    vals.push(v);
  }
  if (patch.notifications) {
    sets.push(`notifications = $${vals.length + 1}`);
    vals.push(JSON.stringify({ ...current.notifications, ...patch.notifications }));
  }
  if (!sets.length) return current;
  const rows = await query(`update settings set ${sets.join(', ')} where id = 1 returning *`, vals);
  const next = toSettings(rows[0]);
  cache = { at: Date.now(), value: next };
  if (patch.emergencyKillSwitch !== undefined && patch.emergencyKillSwitch !== current.emergencyKillSwitch) {
    await logActivity({
      type: 'config',
      level: patch.emergencyKillSwitch ? 'warning' : 'info',
      title: `Emergency kill switch ${patch.emergencyKillSwitch ? 'ENABLED' : 'disabled'}`,
    });
  } else {
    await logActivity({ type: 'config', title: 'Settings updated', detail: Object.keys(patch).join(', ') });
  }
  return next;
}

export async function resetSettings(): Promise<Settings> {
  await query('delete from settings where id = 1');
  cache = null;
  const s = await getSettings();
  await logActivity({ type: 'config', title: 'Settings reset to defaults' });
  return s;
}
