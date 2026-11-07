const NY = 'America/New_York';
const ymd = (t: number) => new Date(t).toLocaleDateString('en-CA', { timeZone: NY }); // YYYY-MM-DD in New York

/** Full calendar days (New York) between a session close and the next open, e.g. ["Saturday", "Sunday"]. */
export function closedDaysBetween(closeMs: number, openMs: number): string[] {
  const names: string[] = [];
  const start = new Date(`${ymd(closeMs)}T12:00:00Z`).getTime();
  const end = new Date(`${ymd(openMs)}T12:00:00Z`).getTime();
  for (let t = start + 86_400_000; t < end; t += 86_400_000) {
    names.push(new Date(t).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }));
  }
  return names;
}
