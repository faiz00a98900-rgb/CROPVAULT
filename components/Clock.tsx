"use client";

import { useEffect, useState } from "react";
import { istTime, istDate } from "@/lib/time";
import { cn } from "@/lib/cn";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now ?? new Date();
}

/** Automatic, self-updating IST time + date block. */
export function LiveClock({ compact }: { compact?: boolean }) {
  const now = useNow(1000);
  if (compact) {
    return (
      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
        {istTime(now)}
      </span>
    );
  }
  return (
    <div className={cn("text-right leading-tight")}>
      <div className="font-mono text-base font-bold tabular-nums text-ink">
        {istTime(now)}
      </div>
      <div className="text-xs text-ink-soft">{istDate(now)}</div>
      <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-leaf-dark">
        IST
        <span className="flex items-center gap-1 text-leaf">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-leaf" />
          LIVE
        </span>
      </div>
    </div>
  );
}
