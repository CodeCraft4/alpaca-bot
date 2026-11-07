import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import { closedDaysBetween } from '../../lib/marketDays';

const NY = 'America/New_York';
const left = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

/**
 * One simple heads-up under the header while the market is OPEN but will stay closed for whole days afterwards
 * (a Friday, or the day before a holiday). It does not limit anything; it only warns about holding over the break.
 */
export const MarketWarningBar: React.FC = () => {
  const { marketOpen, marketStatusKnown, nextClose, nextOpen } = useTradingContext();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!marketStatusKnown || !marketOpen || !nextClose || !nextOpen) return null;
  const closeMs = new Date(nextClose).getTime();
  const openMs = new Date(nextOpen).getTime();
  const days = closedDaysBetween(closeMs, openMs);
  if (days.length === 0) return null; // a normal overnight break: nothing to warn about

  const dayText = days.length === 1 ? days[0] : `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`;
  const opens = new Date(openMs).toLocaleDateString('en-US', { weekday: 'long', timeZone: NY });
  const remaining = Math.max(0, closeMs - now);

  return (
    <div role="status" className="shrink-0 flex items-start gap-2.5 px-4 sm:px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs sm:text-[13px] text-amber-900">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
      <p className="leading-snug">
        <b>Market closes in {left(remaining)} (4:00 PM New York) and stays closed for {days.length} day{days.length > 1 ? 's' : ''} ({dayText}).</b>{' '}
        It reopens {opens} 9:30 AM New York. If you hold a position over the break, it cannot be sold or hit its target until then.
      </p>
    </div>
  );
};
