// IST (Asia/Kolkata, UTC+5:30) time helpers.
// All timestamps are stored as ISO strings (UTC) and formatted for display in IST.

const IST_LOCALE = "en-IN";
const IST_TZ = "Asia/Kolkata";

/** Current time as an ISO (UTC) string. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Auto IST time, e.g. "10:47:32 PM" */
export function istTime(input: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(input));
}

/** IST date, e.g. "Tuesday, 6 October 2026" */
export function istDate(input: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(input));
}

/** Short IST date, e.g. "6 Oct 2026" */
export function istDateShort(input: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(input));
}

/** Compact day + month for timelines, e.g. "6 Oct" */
export function istDayMonth(input: string | Date = new Date()): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
  }).format(new Date(input));
}

/** "Stored On" combined block pieces */
export function istDateTime(input: string | Date): {
  date: string;
  time: string;
} {
  return {
    date: istDateShort(input),
    time: istTime(input),
  };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Whole days elapsed between now (or `to`) and `fromISO`. */
export function daysBetween(fromISO: string, to: Date = new Date()): number {
  const ms = to.getTime() - new Date(fromISO).getTime();
  return Math.max(0, Math.floor(ms / DAY));
}

export function hoursBetween(fromISO: string, to: Date = new Date()): number {
  const ms = to.getTime() - new Date(fromISO).getTime();
  return Math.max(0, Math.floor(ms / HOUR));
}

/** Human storage duration, e.g. "12 days 6 hours" / "5 hours" / "just now" */
export function storageDuration(fromISO: string, to: Date = new Date()): string {
  let ms = to.getTime() - new Date(fromISO).getTime();
  if (ms < MINUTE) return "just now";
  const days = Math.floor(ms / DAY);
  ms -= days * DAY;
  const hours = Math.floor(ms / HOUR);
  ms -= hours * HOUR;
  const minutes = Math.floor(ms / MINUTE);
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (!days && minutes) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
  return parts.join(" ");
}

/** Relative "time ago" for activity feeds, e.g. "3 min ago", "2 h ago" */
export function timeAgo(fromISO: string, to: Date = new Date()): string {
  let ms = to.getTime() - new Date(fromISO).getTime();
  if (ms < MINUTE) return "Just now";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min ago`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)} h ago`;
  return `${Math.floor(ms / DAY)} d ago`;
}

export { DAY, HOUR, MINUTE };
