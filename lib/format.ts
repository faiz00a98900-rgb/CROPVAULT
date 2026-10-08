/** Number / unit formatting helpers. */

export function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

export function fmtKg(kg: number): string {
  return `${fmt(Math.round(kg))} kg`;
}

/** Compact tonnes for big totals: 24580 -> "24.5T" */
export function fmtTonnes(kg: number): string {
  const t = kg / 1000;
  if (t >= 100) return `${Math.round(t)}T`;
  if (t >= 10) return `${t.toFixed(1)}T`;
  return `${t.toFixed(t < 1 ? 2 : 1)}T`;
}
