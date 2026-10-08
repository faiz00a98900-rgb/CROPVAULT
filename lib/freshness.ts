import type { Batch, FreshnessStatus } from "./types";
import { daysBetween, hoursBetween } from "./time";

/**
 * Rule-based freshness system (NO ML).
 *
 * Each crop has a *reference* freshness window in days for typical warehouse
 * storage. These are decision-support estimates only — never guaranteed
 * food-safety judgments. We never claim an exact spoilage date.
 */
export const CROP_FRESHNESS_DAYS: Record<string, number> = {
  // Vegetables (perishable -> short windows)
  Tomato: 7,
  Okra: 4,
  Cucumber: 6,
  Potato: 45,
  Onion: 40,
  // Fruits
  Apple: 30,
  Mango: 9,
  Orange: 14,
  Banana: 6,
  // Grains / Cereals (stable -> long windows)
  Wheat: 180,
  Rice: 160,
  Corn: 120,
  // Cold storage / other
  "Chilled Peas": 12,
  "Frozen Peas": 180,
  "Green Chilli": 8,
  Garlic: 60,
  Ginger: 30,
  Carrot: 20,
  Papaya: 6,
  "Custard Apple": 5,
  Pomegranate: 18,
  Beetroot: 30,
  Kiwi: 21,
  "Sweet Corn": 5,
  "Dragon Fruit": 12,
  Spinach: 4,
  "Bottle Gourd": 7,
  "Lady Finger": 4,
  Brinjal: 6,
  Capsicum: 7,
  Grapes: 8,
  Watermelon: 10,
  Broccoli: 7,
  Cauliflower: 10,
};

/** Crops that should always be physically inspected near the end of window. */
const INSPECT_CANDIDATES = new Set([
  "Tomato",
  "Okra",
  "Cucumber",
  "Banana",
  "Mango",
  "Green Chilli",
  "Papaya",
  "Custard Apple",
  "Sweet Corn",
  "Spinach",
  "Grapes",
]);

export interface Freshness {
  status: FreshnessStatus;
  /** 0..1 fraction of the reference window consumed. */
  consumed: number;
  /** e.g. "~2–4 days" — display only. */
  remainingLabel: string;
  referenceDays: number;
  daysStored: number;
  hint: string;
}

const STATUS_META: Record<
  FreshnessStatus,
  { color: string; bg: string; hint: string }
> = {
  FRESH: {
    color: "text-leaf-dark",
    bg: "bg-leaf/10",
    hint: "Healthy — well within the reference storage window.",
  },
  GOOD: {
    color: "text-leaf",
    bg: "bg-leaf/10",
    hint: "Good condition. Continue routine monitoring.",
  },
  "SELL SOON": {
    color: "text-amber",
    bg: "bg-amber/15",
    hint: "Estimated freshness declining — prioritize sale soon.",
  },
  URGENT: {
    color: "text-amber",
    bg: "bg-amber/25",
    hint: "High freshness risk — prioritize sale and inspect before dispatch.",
  },
  CRITICAL: {
    color: "text-chili",
    bg: "bg-chili/15",
    hint: "Beyond reference window — inspect before sale.",
  },
  INSPECT: {
    color: "text-chili",
    bg: "bg-chili/15",
    hint: "Physical inspection recommended before any sale.",
  },
};

export function freshnessMeta(status: FreshnessStatus) {
  return STATUS_META[status];
}

export function referenceDaysFor(crop: string): number {
  return CROP_FRESHNESS_DAYS[crop] ?? 30;
}

export function computeFreshness(batch: Batch, now: Date = new Date()): Freshness {
  const ref = referenceDaysFor(batch.crop);
  const days = daysBetween(batch.storedAt, now);
  const hours = hoursBetween(batch.storedAt, now);
  const effectiveDays = hours / 24;
  const consumed = Math.min(1.4, ref > 0 ? effectiveDays / ref : 1);

  let status: FreshnessStatus;
  if (consumed < 0.35) status = "FRESH";
  else if (consumed < 0.6) status = "GOOD";
  else if (consumed < 0.82) status = "SELL SOON";
  else if (consumed < 1.0) status = "URGENT";
  else {
    status = INSPECT_CANDIDATES.has(batch.crop) ? "INSPECT" : "CRITICAL";
  }

  // Cold storage / grains keep a stable "GOOD" until truly old.
  if (
    (batch.category === "Grains / Cereals" ||
      batch.storageType === "Cold Storage") &&
    consumed < 0.7
  ) {
    status = consumed < 0.4 ? "FRESH" : "GOOD";
  }

  // Estimated remaining freshness — a decision-support range, never an exact
  // spoilage time. Work in whole hours to avoid fractional-day artifacts.
  const remainingHours = Math.max(0, ref * 24 - hours);
  let remainingLabel: string;
  if (remainingHours <= 0) {
    remainingLabel = "window elapsed";
  } else if (remainingHours < 24) {
    const hi = Math.min(23, remainingHours + 3);
    remainingLabel =
      hi > remainingHours ? `~${remainingHours}–${hi} hours` : `~${remainingHours} hours`;
  } else {
    const rd = Math.max(1, Math.round(remainingHours / 24));
    remainingLabel = `~${Math.max(1, rd - 1)}–${rd + 1} days`;
  }

  return {
    status,
    consumed: Math.min(1, consumed),
    remainingLabel,
    referenceDays: ref,
    daysStored: days,
    hint: STATUS_META[status].hint,
  };
}

/** Urgency score for sorting "Needs Attention" (higher = more urgent). */
export function urgencyScore(batch: Batch, now: Date = new Date()): number {
  const f = computeFreshness(batch, now);
  const statusWeight: Record<FreshnessStatus, number> = {
    CRITICAL: 100,
    INSPECT: 95,
    URGENT: 80,
    "SELL SOON": 60,
    GOOD: 25,
    FRESH: 10,
  };
  // Factor in quantity (bigger at-risk stock matters more) and freshness.
  const qtyFactor = Math.min(1, batch.quantity / 2000); // 0..1
  return statusWeight[f.status] + qtyFactor * 10 + f.consumed * 5;
}

export const STATUS_ORDER: FreshnessStatus[] = [
  "CRITICAL",
  "INSPECT",
  "URGENT",
  "SELL SOON",
  "GOOD",
  "FRESH",
];
