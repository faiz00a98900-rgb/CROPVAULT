"use client";

import Link from "next/link";
import { PackagePlus, RefreshCw, ScanLine } from "lucide-react";
import { useStore } from "@/providers/store";
import { useNow } from "@/components/Clock";
import { timeAgo } from "@/lib/time";
import { totalStockKg, categoryTotals } from "@/lib/selectors";
import { computeFreshness } from "@/lib/freshness";
import { fmt, fmtKg } from "@/lib/format";
import { warehouses } from "@/lib/demo-data";
import {
  KpiCard,
  KPI_ICONS,
  NeedsAttention,
  CategoryDonut,
  WarehouseOverview,
  ActivityFeed,
} from "@/components/dashboard";

export default function DashboardPage() {
  const {
    user,
    visibleBatches,
    scopedBatches,
    movements,
    alerts,
    activeWarehouseId,
    lastSync,
    can,
  } = useStore();
  useNow(1000); // force re-render each second for live "synced" label

  // KPIs, needs-attention and the donut all scope to the active warehouse.
  const attention = scopedBatches.filter((b) => {
    const s = computeFreshness(b).status;
    return ["SELL SOON", "URGENT", "CRITICAL", "INSPECT"].includes(s);
  });

  const totalStock = totalStockKg(scopedBatches);
  const cats = categoryTotals(scopedBatches);
  const activeWh = warehouses.find((w) => w.id === activeWarehouseId);
  const openAlerts = alerts.filter((a) => a.state !== "Resolved").length;

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-5">
      {/* Greeting + sync */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-ink-soft">
            {activeWh ? `${activeWh.name} · ${activeWh.location}` : "Your warehouse at a glance"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="neu-inset-sm flex items-center gap-2 px-3 py-2 text-xs">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wide text-leaf">
              <span className="live-dot h-2 w-2 rounded-full bg-leaf" /> Live
            </span>
            <span className="text-ink-faint">
              Last synchronized: {timeAgo(lastSync)}
            </span>
            <RefreshCw className="h-3.5 w-3.5 text-ink-faint" />
          </div>
          {can("add_inventory") && (
            <Link href="/add-inventory" className="neu-btn-primary !py-2.5 text-sm">
              <PackagePlus className="h-4 w-4" /> Add Inventory
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={KPI_ICONS.stock}
          label="Total Stock"
          value={fmtKg(totalStock)}
          sub={`across ${fmt(scopedBatches.length)} active batches`}
          tone="leaf"
          trend={{ dir: "up", text: "today" }}
        />
        <KpiCard
          icon={KPI_ICONS.batches}
          label="Total Batches"
          value={fmt(scopedBatches.length)}
          sub="tracked units"
          tone="sky"
        />
        <KpiCard
          icon={KPI_ICONS.warehouses}
          label="Warehouses"
          value={fmt(user?.role === "MANAGER" ? warehouses.length : (user?.warehouseIds.length ?? 0))}
          sub="in your scope"
          tone="leaf"
        />
        <KpiCard
          icon={KPI_ICONS.attention}
          label="Needs Attention"
          value={fmt(attention.length)}
          sub={`${openAlerts} open alerts`}
          tone={attention.length ? "chili" : "leaf"}
        />
      </div>

      {/* Needs Attention first (near top) */}
      <NeedsAttention batches={scopedBatches} />

      {/* Distribution + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryDonut data={cats} totalKg={totalStock} />
        </div>
        <ActivityFeed movements={movements.filter((m) =>
          visibleBatches.some((b) => b.id === m.batchId)
        )} />
      </div>

      {/* Warehouse overview */}
      <WarehouseOverview batches={visibleBatches} />

      {/* QR hint / worker note */}
      {can("add_inventory") && (
        <div className="neu-inset flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-base text-leaf-dark shadow-neu-sm">
            <ScanLine className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Scanning is optional</p>
            <p className="text-xs text-ink-soft">
              Scan an existing QR/barcode once to identify a batch, or enter details manually —
              you never need to re-scan to review what is stored.
            </p>
          </div>
          <Link href="/add-inventory" className="neu-btn text-sm">
            Open scanner
          </Link>
        </div>
      )}
    </div>
  );
}
