"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import type { FreshnessStatus } from "@/lib/types";
import { freshnessMeta } from "@/lib/freshness";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  inset,
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div className={cn(inset ? "neu-inset" : "neu-card", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_DOT: Record<FreshnessStatus, string> = {
  FRESH: "bg-leaf-dark",
  GOOD: "bg-leaf",
  "SELL SOON": "bg-amber",
  URGENT: "bg-amber",
  CRITICAL: "bg-chili",
  INSPECT: "bg-chili",
};

export function StatusBadge({
  status,
  className,
}: {
  status: FreshnessStatus;
  className?: string;
}) {
  const meta = freshnessMeta(status);
  return (
    <span className={cn("neu-chip", meta.bg, meta.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </span>
  );
}

export function FreshnessBar({
  consumed,
  status,
  className,
}: {
  consumed: number; // 0..1
  status: FreshnessStatus;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, consumed)) * 100);
  const barColor =
    status === "FRESH" || status === "GOOD"
      ? "bg-leaf"
      : status === "SELL SOON" || status === "URGENT"
      ? "bg-amber"
      : "bg-chili";
  return (
    <div className={cn("fresh-track", className)} title={`${pct}% of reference window used`}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", barColor)}
        style={{ width: `${Math.max(6, pct)}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-base text-ink-faint shadow-neu-sm">
        {icon ?? <Sprout className="h-7 w-7" />}
      </div>
      <p className="text-base font-bold text-ink">{title}</p>
      {message && <p className="max-w-xs text-sm text-ink-soft">{message}</p>}
      {action}
    </div>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg" ? "h-12 w-12 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-base font-black text-leaf-dark shadow-neu-sm",
        dims
      )}
    >
      <Sprout className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </div>
  );
}

export function LinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("neu-btn", className)}>
      {children}
    </Link>
  );
}

export function ProgressBar({
  value,
  tone = "leaf",
  className,
}: {
  value: number; // 0..1
  tone?: "leaf" | "amber" | "chili" | "sky";
  className?: string;
}) {
  const toneClass = {
    leaf: "bg-leaf",
    amber: "bg-amber",
    chili: "bg-chili",
    sky: "bg-sky",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-base shadow-inset-sm", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClass)}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}
