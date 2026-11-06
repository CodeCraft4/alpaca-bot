import React from 'react';
import { Server3D, Radio3D, Database3D } from '../ui/icons3d';
import { useHealth } from '../../lib/useHealth';

type State = 'ok' | 'bad' | 'wait';

const Pill: React.FC<{ state: State; ok: string; bad: string }> = ({ state, ok, bad }) => {
  const cls = state === 'ok' ? 'text-emerald-300' : state === 'bad' ? 'text-red-300' : 'text-amber-300';
  const dot = state === 'ok' ? 'bg-emerald-400' : state === 'bad' ? 'bg-red-400' : 'bg-amber-300';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${state === 'wait' ? 'animate-pulse' : ''}`} />
      {state === 'ok' ? ok : state === 'bad' ? bad : 'Checking'}
    </span>
  );
};

/** Real connection status, reported by the backend (not hard-coded). */
export const SidebarStatus: React.FC = () => {
  const { health, offline } = useHealth();
  const st = (v: string | undefined): State => (offline ? 'bad' : !health ? 'wait' : v === 'ok' ? 'ok' : 'bad');

  const rows = [
    { icon: <Server3D size={18} />, label: 'Backend API', state: offline ? 'bad' : health ? 'ok' : 'wait', ok: 'Online', bad: 'Offline' },
    { icon: <Radio3D size={18} />, label: 'Alpaca Paper', state: st(health?.alpaca), ok: 'Connected', bad: 'Error' },
    { icon: <Database3D size={18} />, label: 'Supabase DB', state: st(health?.database), ok: 'Connected', bad: 'Error' },
  ] as const;

  return (
    <div className="space-y-1.5 p-2.5 rounded-xl bg-black/15 border border-white/10 text-xs">
      {rows.map((r, i) => (
        <div key={r.label} className={`flex items-center justify-between text-[11px] ${i > 0 ? 'pt-1.5 border-t border-white/5' : ''}`}>
          <div className="flex items-center gap-2 text-pink-100">
            {r.icon}
            <span className="font-medium">{r.label}</span>
          </div>
          <Pill state={r.state} ok={r.ok} bad={r.bad} />
        </div>
      ))}
    </div>
  );
};
