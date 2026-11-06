import { alpaca } from '../src/alpaca.js';
import { config } from '../src/config.js';
import { analyze } from '../src/lib/indicators.js';
import { aiAnalysis } from '../src/services/ai.js';
const bars = await alpaca.bars('ABNB', '1Day', new Date(Date.now() - 130 * 864e5).toISOString());
const rules = analyze(bars);
console.log('provider:', config.ANALYSIS_PROVIDER, 'rules says:', rules.sentiment);
console.log(await aiAnalysis(config.ANALYSIS_PROVIDER as any, 'ABNB', rules, bars));
