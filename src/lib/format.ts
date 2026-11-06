/** Shares can be fractional (e.g. 0.0523): never round them to 1 decimal. */
export const fmtQty = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(4))) : '0');

/** Dollars with cents; amounts under 1 cent keep 4 decimals so a tiny profit never shows as $0.00. */
export const fmtUsd = (n: number) => {
  const a = Math.abs(n);
  const d = a > 0 && a < 0.01 ? 4 : 2;
  return `$${a.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};

/** +$1.23 / -$0.45 */
export const fmtSigned = (n: number) => `${n >= 0 ? '+' : '-'}${fmtUsd(n)}`;
