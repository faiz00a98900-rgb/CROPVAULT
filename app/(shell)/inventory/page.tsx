"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Boxes,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { Card, StatusBadge, EmptyState, Skeleton } from "@/components/ui";
import { CATEGORIES, fifoPriorityMap } from "@/lib/selectors";
import { computeFreshness } from "@/lib/freshness";
import { warehouses, warehouseRacks, cropEmoji } from "@/lib/demo-data";
import { storageDuration, istDateShort } from "@/lib/time";
import { fmt } from "@/lib/format";
import { STATUS_ORDER } from "@/lib/freshness";
import type { Batch, FreshnessStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

function InventoryInner() {
  const { visibleBatches, activeWarehouseId } = useStore();
  const { t, tl } = useLanguage();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("all");
  const [warehouse, setWarehouse] = useState(activeWarehouseId);
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState("all");
  const [batchFilter, setBatchFilter] = useState("");
  const [sort, setSort] = useState<"urgency" | "date" | "qty">("urgency");

  const fifo = useMemo(() => fifoPriorityMap(visibleBatches), [visibleBatches]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = visibleBatches.map((b) => ({ b, f: computeFreshness(b) }));
    if (term)
      list = list.filter(
        ({ b }) =>
          b.crop.toLowerCase().includes(term) ||
          b.id.toLowerCase().includes(term) ||
          b.rack.toLowerCase().includes(term)
      );
    if (batchFilter.trim())
      list = list.filter(({ b }) =>
        b.id.toLowerCase().includes(batchFilter.trim().toLowerCase())
      );
    if (category !== "all") list = list.filter(({ b }) => b.category === category);
    if (warehouse !== "all") list = list.filter(({ b }) => b.warehouseId === warehouse);
    if (location !== "all") list = list.filter(({ b }) => b.rack === location);
    if (status !== "all") list = list.filter(({ f }) => f.status === status);

    list.sort((a, z) => {
      if (sort === "qty") return z.b.quantity - a.b.quantity;
      if (sort === "date")
        return new Date(a.b.storedAt).getTime() - new Date(z.b.storedAt).getTime();
      return (
        STATUS_ORDER.indexOf(a.f.status) - STATUS_ORDER.indexOf(z.f.status)
      );
    });
    return list;
  }, [visibleBatches, q, category, warehouse, location, status, batchFilter, sort]);

  const racksForWarehouse = useMemo(() => {
    if (warehouse === "all")
      return Object.values(warehouseRacks).flatMap((secs) => secs.flatMap((s) => s.racks));
    return (warehouseRacks[warehouse] ?? []).flatMap((s) => s.racks);
  }, [warehouse]);

  const reset = () => {
    setQ("");
    setCategory("all");
    setWarehouse("all");
    setLocation("all");
    setStatus("all");
    setBatchFilter("");
    setSort("urgency");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{t("page.inventory.title")}</h1>
          <p className="text-sm text-ink-soft">
            {t("page.inventory.subtitle", { shown: fmt(rows.length), total: fmt(visibleBatches.length) })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tl("Search crop, batch or rack…")}
              className="neu-input pl-10"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="neu-input">
            <option value="all">{tl("All categories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tl(c)}
              </option>
            ))}
          </select>
          <select value={warehouse} onChange={(e) => { setWarehouse(e.target.value); setLocation("all"); }} className="neu-input">
            <option value="all">{tl("All warehouses")}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="neu-input">
            <option value="all">{tl("All locations")}</option>
            {racksForWarehouse.map((r) => (
              <option key={r} value={r}>
                {tl("Rack")} {r}
              </option>
            ))}
          </select>
          <input
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            placeholder={tl("Filter batch #")}
            className="neu-input"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="neu-input">
            <option value="all">{tl("All statuses")}</option>
            {(["FRESH", "GOOD", "SELL SOON", "URGENT", "CRITICAL", "INSPECT"] as FreshnessStatus[]).map(
              (s) => (
                <option key={s} value={s}>
                  {tl(s)}
                </option>
              )
            )}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSort(sort === "date" ? "urgency" : sort === "urgency" ? "qty" : "date")}
              className="neu-btn flex-1 text-sm"
            >
              <ArrowUpDown className="h-4 w-4" />
              {tl("Sort")}: {sort === "date" ? tl("Storage date") : sort === "qty" ? tl("Quantity") : tl("Urgency")}
            </button>
            <button onClick={reset} className="neu-btn !px-3" title={tl("Reset filters")}>
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/50 text-[11px] uppercase tracking-wide text-ink-faint">
                <Th>{tl("Crop")}</Th>
                <Th>{tl("Category")}</Th>
                <Th>{tl("Batch")}</Th>
                <Th className="text-right">{tl("Quantity")}</Th>
                <Th>{tl("Warehouse")}</Th>
                <Th>{tl("Location")}</Th>
                <Th>{tl("Stored On")}</Th>
                <Th>{tl("Duration")}</Th>
                <Th>{tl("Status")}</Th>
                <Th className="text-right">{tl("Actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ b, f }) => (
                <tr key={b.id} className="border-b border-white/40 transition hover:bg-white/30">
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cropEmoji(b.crop)}</span>
                      <span className="font-semibold text-ink">{b.crop}</span>
                      {fifo[b.category] === b.id && (
                        <span className="neu-chip bg-sky/10 text-sky" title={tl("FIFO: sell this batch first")}>
                          FIFO
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td muted>{tl(b.category)}</Td>
                  <Td>
                    <span className="font-mono text-xs">{b.id}</span>
                  </Td>
                  <Td className="text-right font-semibold text-ink">
                    {fmt(b.quantity)} <span className="text-xs text-ink-faint">{b.unit}</span>
                  </Td>
                  <Td muted>{warehouses.find((w) => w.id === b.warehouseId)?.name}</Td>
                  <Td muted>{tl("Rack")} {b.rack}</Td>
                  <Td muted>{istDateShort(b.storedAt)}</Td>
                  <Td muted>{storageDuration(b.storedAt)}</Td>
                  <Td>
                    <StatusBadge status={f.status} />
                  </Td>
                  <Td className="text-right">
                    <Link href={`/batch/${b.id}`} className="neu-btn !px-3 !py-1.5 text-xs">
                      {tl("View")}
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState
            icon={<Filter className="h-7 w-7" />}
            title={tl("No inventory found")}
            message={tl("Try changing your filters or add a new crop batch.")}
          />
        )}
      </Card>

      {/* Cards (mobile) */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Boxes className="h-7 w-7" />}
              title="No inventory found"
              message="Try changing your filters or add a new crop batch."
            />
          </Card>
        ) : (
          rows.map(({ b, f }) => (
            <Link key={b.id} href={`/batch/${b.id}`}>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cropEmoji(b.crop)}</span>
                    <div>
                      <p className="font-bold text-ink">{b.crop}</p>
                      <p className="text-xs text-ink-faint">
                        <span className="font-mono">{b.id}</span> · {tl("Rack")} {b.rack}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">
                    {fmt(b.quantity)} {b.unit}
                  </span>
                  <span className="text-ink-faint">{storageDuration(b.storedAt)} stored</span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}
function Td({
  children,
  className,
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return <td className={cn("px-4 py-3", muted && "text-ink-soft", className)}>{children}</td>;
}

function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InventoryInner />
    </Suspense>
  );
}
