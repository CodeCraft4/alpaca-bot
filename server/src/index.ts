import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { assertSafeTradingConfig, config } from './config.js';
import { dbConfigProblem, dbConfigured } from './db.js';
import { HttpError } from './lib/errors.js';
import { actions } from './routes/actions.js';
import { api } from './routes/api.js';
import { startAutomation } from './services/automation.js';
import { startPriceStream } from './services/priceStream.js';

assertSafeTradingConfig(config);

const app = express();
app.use(cors({ origin: [config.FRONTEND_ORIGIN, 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use('/api', (req, res, next) => {
  const needsDb = !['/health'].includes(req.path);
  if (needsDb && !dbConfigured()) {
    return next(new HttpError(503, dbConfigProblem() ?? 'Database not configured', 'db_not_configured'));
  }
  next();
});
app.use('/api/actions', actions);
app.use('/api', api);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.PORT, () => {
  console.log(`ALPHACA-ABNB server on http://localhost:${config.PORT} [${config.ALPACA_TRADING_ENV}]`);
  startPriceStream();
  if (dbConfigured()) startAutomation();
  else console.warn(`${dbConfigProblem()}: API disabled except /api/health, automation off`);
});
