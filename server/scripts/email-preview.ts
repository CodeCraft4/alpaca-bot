import fs from 'node:fs';
import { renderOrderEmail, renderTradeEmail } from '../src/services/emailTemplates.js';
const spark = [168,170,169,172,171,175,174,173,176,178,177,175,172,170,171,174,176,179,181,180,178,177,180,184,186,185,188,187,189,190];
const order = renderOrderEmail({ stage: 'placed', symbol: 'ABNB', side: 'buy', type: 'market', orderId: 'a1b2c3d4-e5f6-7890', status: 'accepted', env: 'paper',
  shares: 0.2636, entryPrice: 189.74, currentPrice: 190.1, cost: 50, targetPct: 3, targetPrice: 195.43, stopLossPct: 5, stopLossPrice: 180.25,
  sentiment: { label: 'Bullish', confidence: 75, summary: 'Trading well above short-term averages with strong momentum; some caution for a pull-back after the sharp rally.', provider: 'groq / gpt-oss-120b' },
  spark, equity: 100, when: 'Nov 6, 2026, 11:58 AM ET', appUrl: 'http://localhost:5173' });
const trade = renderTradeEmail({ symbol: 'ABNB', shares: 0.2636, entryPrice: 189.74, exitPrice: 195.5, investment: 50, exitValue: 51.54, pl: 1.54, plPct: 3.04, reason: 'Profit Target', holding: '1d 3h', closedAt: 'Nov 7, 2026, 3:10 PM ET', env: 'paper', equity: 101.54, stats: { totalTrades: 4, winRate: 75, totalPl: 6.2 }, appUrl: 'http://localhost:5173' });
fs.writeFileSync('../docs/email-preview-order.html', order.html);
fs.writeFileSync('../docs/email-preview-trade.html', trade.html);
console.log(order.subject, '\n', trade.subject);
