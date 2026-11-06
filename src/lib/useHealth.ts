import { useEffect, useState } from 'react';
import { api } from './api';

export interface Health {
  status: string;
  env: string;
  alpaca: string;
  database: string;
  email?: string;
  analysis?: string;
  automation?: { enabled: boolean; dryRun: boolean; lastRun: string | null };
}

/** Polls the backend health endpoint (shared by the sidebar and the Settings status card). */
export function useHealth(everyMs = 20_000) {
  const [health, setHealth] = useState<Health | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<Health>('/health')
        .then((h) => {
          if (alive) {
            setHealth(h);
            setOffline(false);
          }
        })
        .catch(() => alive && setOffline(true));
    void load();
    const t = setInterval(load, everyMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [everyMs]);

  return { health, offline };
}
