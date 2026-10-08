"use client";

import Link from "next/link";
import {
  Boxes,
  Layers,
  Warehouse as WhIcon,
  TriangleAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/cn";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { Card, StatusBadge, FreshnessBar } from "./ui";
import { fmt, fmtKg, fmtTonnes } from "@/lib/format";
import { cropEmoji, warehouses } from "@/lib/demo-data";
import { computeFreshness } from "@/lib/freshness";
import { warehouseStats } from "@/lib/selectors";
import { storageDuration, timeAgo } from "@/lib/time";
import type { Batch, Movement } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone = "leaf",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: { dir: "up" | "down"; text: string };
  tone?: "leaf" | "amber" | "chili" | "sky";
}) {
  const toneText = {
    leaf: "text-leaf-dark",
    amber: "text-amber",
    chili: "text-chili",
    sky: "text-sky",
  }[tone];
  return (
    <Card className="fade-up p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl bg-base shadow-neu-sm",
            toneText
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend.dir === "up" ? "text-leaf" : "text-amber"
            )}
          >
            {trend.dir === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.text}
          </span>
        )}
      </div>
      <p className={cn("mt-4 text-2xl font-black tracking-tight text-ink sm:text-[28px]", toneText)}>
        {value}
      </p>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>}
    </Card>
  );
}

export const KPI_ICONS = {
  stock: Boxes,
  batches: Layers,
  warehouses: WhIcon,
  attention: TriangleAlert,
};

/* ------------------------------------------------------------------ */
/* Needs Attention                                                     */
/* ------------------------------------------------------------------ */
const RECOMMENDATION: Record<string, string> = {
  CRITICAL: "SELL NOW · INSPECT",
  INSPECT: "INSPECT",
  URGENT: "PRIORITIZE SALE",
  "SELL SOON": "SELL SOON",
};

export function NeedsAttention({ batches }: { batches: Batch[] }) {
  const { tl } = useLanguage();
  const rows = batches
    .map((b) => ({ b, f: computeFreshness(b) }))
    .filter(({ f }) =>
      ["SELL SOON", "URGENT", "CRITICAL", "INSPECT"].includes(f.status)
    )
    .sort((a, z) => z.f.consumed - a.f.consumed)
    .slice(0, 5);

  return (
    <Card className="fade-up p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{tl("Needs Attention")}</h2>
          <p className="text-sm text-ink-soft">
            {tl("Batches that require action now — sorted by urgency & freshness.")}
          </p>
        </div>
        <Link href="/alerts" className="neu-btn !py-2 text-xs">
          {tl("View all")} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink-soft">
          {tl("🎉 Nothing needs attention right now. All stock is fresh.")}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map(({ b, f }) => (
            <Link
              key={b.id}
              href={`/batch/${b.id}`}
              className="block rounded-xl2 bg-base p-3 shadow-inset-sm transition hover:shadow-inset sm:flex sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3 sm:w-64">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-base text-xl shadow-neu-xs">
                  {cropEmoji(b.crop)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">
                    {b.crop}{" "}
                    <span className="font-medium text-ink-soft">
                      · {fmt(b.quantity)} {b.unit}
                    </span>
                  </p>
                  <p className="text-xs text-ink-faint">
                    Batch {b.id} · {storageDuration(b.storedAt)} in storage
                  </p>
                </div>
              </div>
              <div className="mt-3 flex-1 sm:mt-0">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={f.status} />
                  <span className="text-xs font-medium text-ink-soft">
                    Est. freshness: {f.remainingLabel}
                  </span>
                </div>
                <FreshnessBar consumed={f.consumed} status={f.status} className="mt-2" />
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Recommendation: {tl(RECOMMENDATION[f.status])}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Category donut                                                      */
/* ------------------------------------------------------------------ */
const CAT_COLORS: Record<string, string> = {
  Vegetables: "#2F6B3B",
  Fruits: "#C68A20",
  "Grains / Cereals": "#4C8A58",
  "Cold Storage": "#3A6EA5",
  "Other Crops": "#8A968A",
};

export function CategoryDonut({
  data,
  totalKg,
}: {
  data: { name: string; value: number; percent: number }[];
  totalKg: number;
}) {
  const { tl } = useLanguage();
  return (
    <Card className="fade-up p-5">
      <h2 className="text-lg font-bold text-ink">{tl("Inventory by Category")}</h2>
      <p className="text-sm text-ink-soft">{tl("Distribution of stock across the warehouse.")}</p>
      <div className="relative mx-auto mt-2 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={CAT_COLORS[d.name] ?? "#8A968A"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [`${fmt(v)} kg`, n]}
              contentStyle={{
                borderRadius: 14,
                border: "none",
                background: "#F1EDE3",
                boxShadow: "5px 5px 12px rgba(163,153,128,0.5)",
                color: "#2E3A2F",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-ink">{fmtTonnes(totalKg)}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {tl("Total Inventory")}
          </span>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: CAT_COLORS[d.name] }}
            />
            <span className="text-ink-soft">{tl(d.name)}</span>
            <span className="ml-auto font-semibold text-ink">{d.percent}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Warehouse overview                                                  */
/* ------------------------------------------------------------------ */
export function WarehouseOverview({ batches }: { batches: Batch[] }) {
  const { accessibleWarehouseIds, activeWarehouseId } = useStore();
  const { tl } = useLanguage();
  const list = warehouses.filter((w) => accessibleWarehouseIds.includes(w.id));
  return (
    <Card className="fade-up p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{tl("Warehouse Overview")}</h2>
          <p className="text-sm text-ink-soft">{tl("Tap a warehouse to open its inventory.")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((w) => {
          const s = warehouseStats(w, batches.filter((b) => b.warehouseId === w.id));
          const tone = s.alerts > 0 ? "amber" : "leaf";
          const active = w.id === activeWarehouseId;
          return (
            <Link
              key={w.id}
              href={`/warehouses?open=${w.id}`}
              className={cn(
                "group rounded-xl2 bg-base p-4 shadow-neu-sm transition hover:shadow-neu active:shadow-pressed",
                active && "!shadow-inset"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-base text-sm font-black text-leaf-dark shadow-inset-sm">
                    {w.code}
                  </span>
                  <div>
                    <p className="font-bold text-ink">{w.name}</p>
                    <p className="text-[11px] text-ink-faint">{w.location}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-leaf-dark" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label={tl("Stock")} value={fmtKg(s.stock)} />
                <Stat label={tl("Batches")} value={String(s.batches)} />
                <Stat label={tl("Alerts")} value={String(s.alerts)} tone={s.alerts ? "chili" : undefined} />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-ink-faint">
                  <span>
                    Racks {s.occupied}/{s.totalRacks || "—"}
                  </span>
                  <span>{Math.round(s.fill * 100)}% full</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-base shadow-inset-sm">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      tone === "amber" ? "bg-amber" : "bg-leaf"
                    )}
                    style={{ width: `${Math.max(4, Math.min(100, s.fill * 100))}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "chili";
}) {
  return (
    <div className="rounded-xl bg-base px-1 py-2 shadow-inset-sm">
      <p
        className={cn(
          "text-sm font-bold",
          tone === "chili" ? "text-chili" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */
const ACTION_LABEL: Record<Movement["action"], { text: string; cls: string }> = {
  ADD: { text: "added", cls: "text-leaf" },
  SELL: { text: "sold", cls: "text-amber" },
  MOVE: { text: "moved", cls: "text-sky" },
  REMOVE: { text: "removed", cls: "text-chili" },
  DISPOSE: { text: "disposed", cls: "text-chili" },
};

export function ActivityFeed({ movements }: { movements: Movement[] }) {
  const { tl } = useLanguage();
  const recent = movements.slice(0, 8);
  return (
    <Card className="fade-up p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{tl("Recent Activity")}</h2>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-leaf">
          <span className="live-dot h-2 w-2 rounded-full bg-leaf" /> {tl("Live")}
        </span>
      </div>
      <ol className="mt-4 space-y-3">
        {recent.map((m) => {
          const a = ACTION_LABEL[m.action];
          return (
            <li key={m.id} className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-base shadow-inset-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {fmt(m.quantity)} {m.crop === "" ? "" : ""}
                    {m.crop && <span> {m.crop}</span>}
                  </span>{" "}
                  <span className={cn("font-semibold", a.cls)}>{tl(a.text)}</span>
                </p>
                <p className="text-[11px] text-ink-faint">
                  {m.batchId} · {timeAgo(m.at)} · {m.by}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
