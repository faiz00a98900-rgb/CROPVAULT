import type { Alert, AlertState, Batch, Category, Warehouse } from "./types";
import { computeFreshness, urgencyScore } from "./freshness";
import { daysBetween } from "./time";
import { warehouseRacks } from "./demo-data";

export const CATEGORIES: Category[] = [
  "Vegetables",
  "Fruits",
  "Grains / Cereals",
  "Cold Storage",
  "Other Crops",
];

const PRIORITY_BY_STATUS: Record<string, Alert["priority"]> = {
  CRITICAL: "Critical",
  INSPECT: "Critical",
  URGENT: "High",
  "SELL SOON": "Medium",
};

/** Build the derived alert list from current batches. */
export function deriveAlerts(
  batches: Batch[],
  overrides: Record<string, AlertState> = {},
  now: Date = new Date()
): Alert[] {
  const alerts: Alert[] = [];
  for (const b of batches) {
    const f = computeFreshness(b, now);
    const push = (
      type: Alert["type"],
      priority: Alert["priority"],
      message: string
    ) => {
      const id = `${b.id}:${type}`;
      alerts.push({
        id,
        batchId: b.id,
        crop: b.crop,
        type,
        priority,
        message,
        state: overrides[id] ?? "Open",
        at: b.storedAt,
      });
    };

    if (f.status === "CRITICAL" || f.status === "INSPECT") {
      push(
        "INSPECTION REQUIRED",
        "Critical",
        `${b.crop} (${b.id}) is beyond its reference window — ${f.hint.toLowerCase()}`
      );
    } else if (f.status === "URGENT") {
      push("URGENT", "High", `${b.crop} (${b.id}) — high freshness risk, prioritize sale.`);
    } else if (f.status === "SELL SOON") {
      push("SELL SOON", "Medium", `${b.crop} (${b.id}) — estimated freshness ${f.remainingLabel}.`);
    }

    if (b.quantity <= b.lowStockThreshold) {
      push("LOW STOCK", "Medium", `${b.crop} (${b.id}) stock low — ${b.quantity} ${b.unit} remaining.`);
    }

    const days = daysBetween(b.storedAt, now);
    if (f.referenceDays >= 30 && days > f.referenceDays * 0.6) {
      push("OLD STOCK", "Low", `${b.crop} (${b.id}) stored ${days} days — review for FIFO.`);
    }
  }

  const rank: Record<Alert["priority"], number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  return alerts.sort((a, z) => {
    if (a.state !== z.state) {
      const openRank = (s: AlertState) => (s === "Open" ? 0 : s === "In Review" ? 1 : 2);
      return openRank(a.state) - openRank(z.state);
    }
    return rank[a.priority] - rank[z.priority];
  });
}

export const STATUS_TO_PRIORITY = PRIORITY_BY_STATUS;

/** Batches that "Need Attention" (non-resolved, actionable freshness), sorted by urgency. */
export function needsAttention(
  batches: Batch[],
  now: Date = new Date()
): { batch: Batch; urgency: number }[] {
  return batches
    .map((batch) => ({ batch, urgency: urgencyScore(batch, now) }))
    .filter(({ batch }) => {
      const s = computeFreshness(batch, now).status;
      return s === "SELL SOON" || s === "URGENT" || s === "CRITICAL" || s === "INSPECT";
    })
    .sort((a, z) => z.urgency - a.urgency);
}

/** FIFO priority: earliest-stored active batch per category. */
export function fifoPriorityMap(batches: Batch[]): Record<string, string> {
  const byCat: Record<string, Batch> = {} as Record<string, Batch>;
  for (const b of batches) {
    const cur = byCat[b.category];
    if (!cur || new Date(b.storedAt) < new Date(cur.storedAt)) {
      byCat[b.category] = b;
    }
  }
  const map: Record<string, string> = {};
  for (const [cat, b] of Object.entries(byCat)) map[cat] = b.id;
  return map;
}

export function fifoReason(batch: Batch, map: Record<string, string>): string | null {
  if (map[batch.category] === batch.id) {
    return "Stored earlier than other batches in the same category.";
  }
  return null;
}

/** Category totals in kg for the donut chart. */
export function categoryTotals(batches: Batch[]): {
  name: Category;
  value: number;
  percent: number;
}[] {
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const b of batches) {
    const kg = toKg(b);
    totals[b.category] = (totals[b.category] ?? 0) + kg;
    grand += kg;
  }
  return CATEGORIES.map((c) => ({
    name: c,
    value: Math.round(totals[c] ?? 0),
    percent: grand ? Math.round(((totals[c] ?? 0) / grand) * 100) : 0,
  })).filter((c) => c.value > 0);
}

export function toKg(b: Batch): number {
  // Demo data uses kg across the board; keep a hook for unit conversion.
  if (b.unit === "quintal") return b.quantity * 100;
  return b.quantity;
}

export function totalStockKg(batches: Batch[]): number {
  return batches.reduce((s, b) => s + toKg(b), 0);
}

export function warehouseStats(wh: Warehouse, batches: Batch[], now: Date = new Date()) {
  const inWh = batches.filter((b) => b.warehouseId === wh.id);
  const stock = inWh.reduce((s, b) => s + toKg(b), 0);
  const racks = new Set(inWh.map((b) => b.rack));
  const alerts = inWh.filter((b) => {
    const s = computeFreshness(b, now).status;
    return s === "SELL SOON" || s === "URGENT" || s === "CRITICAL" || s === "INSPECT";
  }).length;
  const totalRacks = (warehouseRacks[wh.id] ?? []).reduce(
    (n, sec) => n + sec.racks.length,
    0
  );
  return {
    stock,
    batches: inWh.length,
    occupied: racks.size,
    totalRacks,
    alerts,
    fill: Math.min(1, stock / wh.capacity),
  };
}
