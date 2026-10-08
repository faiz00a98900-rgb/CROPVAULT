import type { Movement } from "./types";

const DAY = 24 * 3600 * 1000;

function istDayIndex(iso: string, base: number): number {
  // days before "today" (IST) for the given timestamp
  const d = new Date(iso).getTime();
  return Math.floor((base - d) / DAY);
}

/**
 * Aggregate movements into the last `days` IST calendar buckets for charts.
 * Returns oldest -> newest with short weekday labels.
 */
export function daysAgoKey(
  movements: Movement[],
  days = 7
): { day: string; add: number; sell: number; remove: number }[] {
  const now = Date.now();
  const buckets = Array.from({ length: days }, () => ({
    add: 0,
    sell: 0,
    remove: 0,
  }));
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * DAY);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(d);
  });

  for (const m of movements) {
    const idx = istDayIndex(m.at, now);
    const bucket = days - 1 - idx; // 0 = oldest
    if (bucket < 0 || bucket >= days) continue;
    if (m.action === "ADD") buckets[bucket].add += m.quantity;
    else if (m.action === "SELL") buckets[bucket].sell += m.quantity;
    else if (m.action === "REMOVE" || m.action === "DISPOSE")
      buckets[bucket].remove += m.quantity;
  }

  return buckets.map((b, i) => ({ ...b, day: labels[i] }));
}
