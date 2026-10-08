"use client";

import Link from "next/link";
import { Tags, ChevronRight, Leaf, Apple, Wheat, Snowflake, Sprout } from "lucide-react";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { Card, StatusBadge } from "@/components/ui";
import { CATEGORIES, categoryTotals, toKg } from "@/lib/selectors";
import { computeFreshness } from "@/lib/freshness";
import { cropEmoji } from "@/lib/demo-data";
import { fmt, fmtKg } from "@/lib/format";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";

const CAT_ICON: Record<Category, typeof Leaf> = {
  Vegetables: Leaf,
  Fruits: Apple,
  "Grains / Cereals": Wheat,
  "Cold Storage": Snowflake,
  "Other Crops": Sprout,
};

const CAT_COLOR: Record<Category, string> = {
  Vegetables: "#2F6B3B",
  Fruits: "#C68A20",
  "Grains / Cereals": "#4C8A58",
  "Cold Storage": "#3A6EA5",
  "Other Crops": "#8A968A",
};

export default function CategoriesPage() {
  const { visibleBatches } = useStore();
  const { t: tt } = useLanguage();
  const totals = categoryTotals(visibleBatches);
  const grand = totals.reduce((s, t) => s + t.value, 0) || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{tt("page.categories.title")}</h1>
        <p className="text-sm text-ink-soft">
          {tt("page.categories.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const batches = visibleBatches.filter((b) => b.category === cat);
          const t = totals.find((x) => x.name === cat);
          const kg = t?.value ?? 0;
          const pct = Math.round((kg / grand) * 100);
          const attention = batches.filter((b) => {
            const s = computeFreshness(b).status;
            return ["SELL SOON", "URGENT", "CRITICAL", "INSPECT"].includes(s);
          }).length;
          const Icon = CAT_ICON[cat];

          return (
            <Card key={cat} className="fade-up p-5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-base shadow-neu-sm"
                  style={{ color: CAT_COLOR[cat] }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-ink">{cat}</h2>
                    <span className="text-sm font-black text-ink">{pct}%</span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {fmt(batches.length)} batches · {fmtKg(kg)}
                  </p>
                </div>
              </div>

              {/* share bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-base shadow-inset-sm">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, pct)}%`, background: CAT_COLOR[cat] }}
                />
              </div>

              {attention > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                  {attention} batch{attention > 1 ? "es" : ""} need attention
                </div>
              )}

              <div className="mt-3 space-y-1.5">
                {batches.slice(0, 4).map((b) => {
                  const f = computeFreshness(b);
                  return (
                    <Link
                      key={b.id}
                      href={`/batch/${b.id}`}
                      className="flex items-center gap-2 rounded-xl bg-base px-3 py-2 text-sm shadow-inset-sm transition hover:shadow-neu-xs"
                    >
                      <span>{cropEmoji(b.crop)}</span>
                      <span className="font-medium text-ink">{b.crop}</span>
                      <span className="font-mono text-[11px] text-ink-faint">{b.id}</span>
                      <span className="ml-auto text-xs text-ink-soft">
                        {fmt(toKg(b))} kg
                      </span>
                      <StatusBadge status={f.status} className="!px-1.5 !py-0.5 text-[9px]" />
                      <ChevronRight className="h-4 w-4 text-ink-faint" />
                    </Link>
                  );
                })}
                {batches.length === 0 && (
                  <p className="flex items-center gap-1.5 rounded-xl bg-base px-3 py-2 text-xs text-ink-faint shadow-inset-sm">
                    <Tags className="h-3.5 w-3.5" /> No batches in this category yet.
                  </p>
                )}
              </div>

              {batches.length > 4 && (
                <Link
                  href={`/inventory`}
                  className={cn("mt-2 inline-block text-xs font-semibold text-leaf-dark hover:underline")}
                >
                  View all {batches.length} batches →
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
