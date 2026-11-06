import { config } from '../src/config.js';
const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { authorization: `Bearer ${config.GROQ_API_KEY}` } });
const j: any = await r.json();
console.log(r.status, (j.data ?? []).map((m: any) => `${m.id} (${m.owned_by}, ctx ${m.context_window})`).join('\n') || JSON.stringify(j).slice(0, 300));
