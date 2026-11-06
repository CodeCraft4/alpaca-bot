import nodemailer from 'nodemailer';
import { alpaca } from '../src/alpaca.js';
import { config } from '../src/config.js';
import { renderOrderEmail } from '../src/services/emailTemplates.js';
const t = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE === 'true', auth: { user: config.SMTP_USER, pass: config.SMTP_PASS.replace(/\s+/g, '') } });
await t.verify(); console.log('SMTP login: ok');
const { price } = await alpaca.latestPrice('ABNB');
const bars = await alpaca.bars('ABNB', '1Day', new Date(Date.now() - 50 * 864e5).toISOString());
const shares = +(25 / price).toFixed(4);
const m = renderOrderEmail({ stage: 'placed', symbol: 'ABNB', side: 'buy', type: 'market', orderId: 'SAMPLE-0000-0000', status: 'sample (not a real order)', env: config.ALPACA_TRADING_ENV,
  shares, entryPrice: price, currentPrice: price, cost: shares * price, targetPct: 3, targetPrice: +(price * 1.03).toFixed(2), stopLossPct: 5, stopLossPrice: +(price * 0.95).toFixed(2),
  sentiment: { label: 'Bullish', confidence: 75, summary: 'Sample analysis text for layout preview.', provider: 'groq' }, spark: bars.slice(-30).map((b) => b.c), equity: 100, when: new Date().toLocaleString(), appUrl: config.APP_URL });
const r = await t.sendMail({ from: config.EMAIL_FROM || config.SMTP_USER, to: config.ALERT_NOTIFICATION_EMAIL, subject: m.subject, html: m.html, text: m.text });
console.log('sent:', r.accepted, r.response?.slice(0, 40));
