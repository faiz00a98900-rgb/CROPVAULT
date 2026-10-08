"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Boxes, TriangleAlert, Grid3x3, PieChart, History } from "lucide-react";
import { useStore } from "@/providers/store";
import { Card, StatusBadge } from "@/components/ui";
import { warehouses, warehouseRacks, cropEmoji } from "@/lib/demo-data";
import { warehouseStats, categoryTotals } from "@/lib/selectors";
import { computeFreshness } from "@/lib/freshness";
import { fmt, fmtKg } from "@/lib/format";
import { cn } from "@/lib/cn";

function WarehousesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const {
    visibleBatches,
    movements,
    accessibleWarehouseIds,
    activeWarehouseId,
    setActiveWarehouse,
  } = useStore();

  const list = warehouses.filter((w) => accessibleWarehouseIds.includes(w.id));

  // Deep link (?open=warehouse-b) drives the selection; the store's active
  // warehouse is the single source of truth so it stays in sync everywhere.
  const requested = params.get("open");
  useEffect(() => {
    if (requested && accessibleWarehouseIds.includes(requested)) {
      setActiveWarehouse(requested);
    }
  }, [requested, accessibleWarehouseIds, setActiveWarehouse]);

  const currentId = accessibleWarehouseIds.includes(activeWarehouseId)
    ? activeWarehouseId
    : list[0]?.id;
  const current = list.find((w) => w.id === currentId) ?? list[0];

  const openWarehouse = (id: string) => {
    setActiveWarehouse(id);
    router.replace(`/warehouses?open=${id}`, { scroll: false });
  };

  // Query by the selected warehouse's unique id — never by name, never "A".
  const racksOccupied = useMemo(() => {
    const map: Record<string, typeof visibleBatches> = {};
    for (const b of visibleBatches) {
      if (b.warehouseId !== current?.id) continue;
      (map[b.rack] ??= []).push(b);
    }
    return map;
  }, [visibleBatches, current]);

  if (!current) {
    return <Card className="p-8 text-center text-ink-soft">No warehouses assigned to you.</Card>;
  }

  const stat = warehouseStats(current, visibleBatches);

  // Everything below is scoped to the selected warehouse's unique id.
  const whBatches = visibleBatches.filter((b) => b.warehouseId === current.id);
  const whCats = categoryTotals(whBatches);
  const whMovements = movements
    .filter((m) => m.warehouseId === current.id)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Warehouses</h1>
        <p className="text-sm text-ink-soft">
          Storage facilities, sections and racks — tap a warehouse to explore.
        </p>
      </div>

      {/* Warehouse selector cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((w) => {
          const s = warehouseStats(w, visibleBatches.filter((b) => b.warehouseId === w.id));
          const active = w.id === current.id;
          return (
            <button
              key={w.id}
              onClick={() => openWarehouse(w.id)}
              className={cn(
                "rounded-xl2 bg-base p-4 text-left shadow-neu-sm transition active:shadow-pressed",
                active && "!shadow-inset"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-base text-sm font-black text-leaf-dark shadow-inset-sm">
                  {w.code}
                </span>
                <p className="font-bold text-ink">{w.name}</p>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-faint">
                <MapPin className="h-3 w-3" /> {w.location}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <Mini label="Stock" value={fmtKg(s.stock)} />
                <Mini label="Batch" value={String(s.batches)} />
                <Mini label="Alerts" value={String(s.alerts)} tone={s.alerts ? "chili" : undefined} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{current.name}</h2>
            <p className="text-sm text-ink-soft">
              {current.sections.length} sections · capacity{" "}
              {fmtKg(current.capacity)} · {Math.round(stat.fill * 100)}% full
            </p>
          </div>
          <Link href={`/inventory`} className="neu-btn text-sm">
            <Boxes className="h-4 w-4" /> View inventory
          </Link>
        </div>

        {/* capacity bar */}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-base shadow-inset-sm">
          <div
            className={cn("h-full rounded-full", stat.fill > 0.9 ? "bg-chili" : "bg-leaf")}
            style={{ width: `${Math.min(100, stat.fill * 100)}%` }}
          />
        </div>

        {/* Sections + racks */}
        <div className="mt-5 space-y-5">
          {warehouseRacks[current.id]?.map((sec) => (
            <div key={sec.section}>
              <div className="mb-2 flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-leaf-dark" />
                <h3 className="text-sm font-bold text-ink">Section {sec.section}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {sec.racks.map((rack) => {
                  const items = racksOccupied[rack] ?? [];
                  const occupied = items.length > 0;
                  const hasAlert = items.some((b) => {
                    const st = computeFreshness(b).status;
                    return ["SELL SOON", "URGENT", "CRITICAL", "INSPECT"].includes(st);
                  });
                  return (
                    <div
                      key={rack}
                      className={cn(
                        "rounded-xl p-3 transition",
                        occupied ? "bg-base shadow-neu-xs" : "bg-base shadow-inset-sm"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-ink">Rack {rack}</span>
                        {occupied ? (
                          hasAlert ? (
                            <TriangleAlert className="h-4 w-4 text-chili" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-leaf" />
                          )
                        ) : (
                          <span className="text-[10px] uppercase text-ink-faint">empty</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {items.map((b) => {
                          const f = computeFreshness(b);
                          return (
                            <Link
                              key={b.id}
                              href={`/batch/${b.id}`}
                              className="flex items-center gap-1.5 rounded-lg bg-base px-2 py-1 text-xs shadow-inset-sm transition hover:shadow-neu-xs"
                            >
                              <span>{cropEmoji(b.crop)}</span>
                              <span className="truncate font-medium text-ink">{b.crop}</span>
                              <span className="ml-auto text-ink-faint">{fmt(b.quantity)}</span>
                              <StatusBadge status={f.status} className="!px-1.5 !py-0.5 text-[9px]" />
                            </Link>
                          );
                        })}
                        {!occupied && (
                          <p className="text-[11px] text-ink-faint">Available</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Category distribution + movement for the selected warehouse */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl2 bg-base p-4 shadow-inset-sm">
            <div className="mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-leaf-dark" />
              <h3 className="text-sm font-bold text-ink">Category distribution</h3>
            </div>
            {whCats.length === 0 ? (
              <p className="text-xs text-ink-faint">No stock in this warehouse yet.</p>
            ) : (
              <ul className="space-y-2">
                {whCats.map((c) => (
                  <li key={c.name} className="text-xs">
                    <div className="mb-1 flex justify-between">
                      <span className="text-ink-soft">{c.name}</span>
                      <span className="font-semibold text-ink">
                        {fmt(c.value)} kg · {c.percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-base shadow-inset-sm">
                      <div
                        className="h-full rounded-full bg-leaf"
                        style={{ width: `${Math.max(3, c.percent)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl2 bg-base p-4 shadow-inset-sm">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-leaf-dark" />
              <h3 className="text-sm font-bold text-ink">Recent stock movement</h3>
            </div>
            {whMovements.length === 0 ? (
              <p className="text-xs text-ink-faint">No movements recorded here yet.</p>
            ) : (
              <ul className="space-y-2">
                {whMovements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-lg bg-base px-2.5 py-1.5 text-xs shadow-inset-sm"
                  >
                    <span>{cropEmoji(m.crop)}</span>
                    <span className="font-medium text-ink">{m.action}</span>
                    <span className="text-ink-soft">
                      {fmt(m.quantity)} {m.crop}
                    </span>
                    <span className="ml-auto text-ink-faint">{m.by}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "chili";
}) {
  return (
    <div className="rounded-lg bg-base px-1 py-1.5 shadow-inset-sm">
      <p className={cn("text-xs font-bold", tone === "chili" ? "text-chili" : "text-ink")}>
        {value}
      </p>
      <p className="text-[9px] uppercase text-ink-faint">{label}</p>
    </div>
  );
}

export default function WarehousesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-soft">Loading…</div>}>
      <WarehousesInner />
    </Suspense>
  );
}
