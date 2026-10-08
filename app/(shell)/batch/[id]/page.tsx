"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Boxes,
  ArrowLeftRight,
  History,
  Info,
  Trophy,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { Card, StatusBadge, FreshnessBar, EmptyState } from "@/components/ui";
import { computeFreshness, freshnessMeta } from "@/lib/freshness";
import { fifoPriorityMap, fifoReason } from "@/lib/selectors";
import { warehouses, warehouseRacks, cropEmoji } from "@/lib/demo-data";
import { istDateShort, istTime, storageDuration } from "@/lib/time";
import { fmt } from "@/lib/format";
import type { Movement } from "@/lib/types";
import { cn } from "@/lib/cn";

const ACTION_META: Record<
  Movement["action"],
  { label: string; icon: typeof Boxes; cls: string }
> = {
  ADD: { label: "Batch added", icon: Boxes, cls: "text-leaf" },
  SELL: { label: "Sold", icon: ArrowLeftRight, cls: "text-amber" },
  MOVE: { label: "Moved", icon: MapPin, cls: "text-sky" },
  REMOVE: { label: "Removed", icon: ArrowLeftRight, cls: "text-chili" },
  DISPOSE: { label: "Disposed", icon: ArrowLeftRight, cls: "text-chili" },
};

export default function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { visibleBatches, movements, alerts, can } = useStore();
  const { toast } = useToast();

  const batch = visibleBatches.find((b) => b.id.toLowerCase() === id?.toLowerCase());

  if (!batch) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          title="Batch not found"
          message="This batch may have been removed or is outside your assigned warehouses."
          action={
            <Link href="/inventory" className="neu-btn">
              Back to inventory
            </Link>
          }
        />
      </Card>
    );
  }

  const f = computeFreshness(batch);
  const meta = freshnessMeta(f.status);
  const wh = warehouses.find((w) => w.id === batch.warehouseId);
  const fifo = fifoPriorityMap(visibleBatches);
  const isFifo = fifo[batch.category] === batch.id;
  const history = movements.filter((m) => m.batchId.toLowerCase() === batch.id.toLowerCase());
  const batchAlerts = alerts.filter((a) => a.batchId === batch.id && a.state !== "Resolved");

  const rackOptions = (warehouseRacks[batch.warehouseId] ?? []).flatMap((s) => s.racks);

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="neu-btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-base text-3xl shadow-neu">
              {cropEmoji(batch.crop)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-ink">{batch.crop}</h1>
                <StatusBadge status={f.status} />
                {isFifo && (
                  <span className="neu-chip bg-sky/10 text-sky">
                    <Trophy className="h-3 w-3" /> FIFO priority
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">
                {batch.category} · Batch{" "}
                <span className="font-mono text-ink">{batch.id}</span>
              </p>
            </div>
          </div>
          <div className="rounded-xl2 bg-base px-5 py-3 text-center shadow-inset-sm">
            <p className="text-2xl font-black text-ink">{fmt(batch.quantity)}</p>
            <p className="text-xs uppercase tracking-wide text-ink-faint">{batch.unit} in stock</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: details + freshness */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              <Detail icon={<Boxes className="h-4 w-4" />} label="Quantity">
                {fmt(batch.quantity)} {batch.unit}
              </Detail>
              <Detail icon={<MapPin className="h-4 w-4" />} label="Warehouse">
                {wh?.name}
              </Detail>
              <Detail icon={<MapPin className="h-4 w-4" />} label="Rack / location">
                Rack {batch.rack}
              </Detail>
              <Detail icon={<Boxes className="h-4 w-4" />} label="Storage type">
                {batch.storageType}
              </Detail>
              <Detail icon={<Clock className="h-4 w-4" />} label="Stored on">
                {istDateShort(batch.storedAt)}
              </Detail>
              <Detail icon={<Clock className="h-4 w-4" />} label="Stored at">
                {istTime(batch.storedAt)} IST
              </Detail>
            </dl>
            <div className="neu-inset-sm mt-4 flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink-soft">Storage duration</span>
              <span className="font-bold text-ink">{storageDuration(batch.storedAt)}</span>
            </div>
            {batch.notes && (
              <p className="mt-3 rounded-xl bg-base px-3 py-2 text-sm text-ink-soft shadow-inset-sm">
                <span className="font-semibold text-ink">Notes: </span>
                {batch.notes}
              </p>
            )}
          </Card>

          {/* Freshness */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Freshness &amp; storage status</h2>
              <StatusBadge status={f.status} />
            </div>
            <div className="mt-4">
              <FreshnessBar consumed={f.consumed} status={f.status} />
              <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                <span>{f.daysStored} days stored</span>
                <span>reference window ≈ {f.referenceDays} days</span>
              </div>
            </div>
            <div className={cn("mt-4 rounded-xl p-3 text-sm", meta.bg, meta.color)}>
              <p className="font-semibold">{f.hint}</p>
              <p className="mt-0.5 text-xs opacity-90">
                Estimated freshness remaining: {f.remainingLabel}. This is decision-support only —
                always inspect before sale. The system never guarantees a spoilage date.
              </p>
            </div>
            {isFifo && fifoReason(batch, fifo) && (
              <div className="neu-inset-sm mt-3 flex items-center gap-2 px-3 py-2 text-xs text-ink-soft">
                <Info className="h-4 w-4 shrink-0 text-sky" />
                <span>
                  <b className="text-ink">FIFO:</b> Prioritize this batch — {fifoReason(batch, fifo)}
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Right: actions + alerts */}
        <div className="space-y-4">
          {can("record_movement") && (
            <Card className="p-5">
              <h2 className="mb-3 text-base font-bold text-ink">Record movement</h2>
              <p className="mb-3 text-xs text-ink-soft">
                Every movement creates a timestamped history record.
              </p>
              <div className="space-y-2">
                <button
                  className="neu-btn w-full"
                  onClick={() =>
                    router.push(`/stock-movement?batch=${batch.id}&action=SELL`)
                  }
                >
                  <ArrowLeftRight className="h-4 w-4" /> Sell / move stock
                </button>
                <button
                  className="neu-btn w-full"
                  onClick={() => router.push(`/stock-movement?batch=${batch.id}&action=MOVE`)}
                >
                  <MapPin className="h-4 w-4" /> Move rack
                </button>
              </div>
              {rackOptions.length > 0 && (
                <p className="mt-3 text-[11px] text-ink-faint">
                  Available racks: {rackOptions.join(", ")}
                </p>
              )}
            </Card>
          )}

          {batchAlerts.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-2 text-base font-bold text-ink">Open alerts</h2>
              <ul className="space-y-2">
                {batchAlerts.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs",
                      a.priority === "Critical"
                        ? "bg-chili/10 text-chili"
                        : a.priority === "High"
                        ? "bg-amber/15 text-amber"
                        : "bg-base text-ink-soft shadow-inset-sm"
                    )}
                  >
                    <b>{a.type}</b> — {a.message}
                  </li>
                ))}
              </ul>
              <Link href="/alerts" className="neu-btn mt-3 w-full text-sm">
                Manage alerts
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-leaf-dark" />
          <h2 className="text-base font-bold text-ink">Movement history</h2>
        </div>
        {history.length === 0 ? (
          <EmptyState
            icon={<History className="h-7 w-7" />}
            title="No movement yet"
            message="Actions recorded for this batch will appear here."
          />
        ) : (
          <ol className="relative ml-3 space-y-6 border-l-2 border-base-deep pl-6">
            {history.map((m) => {
              const a = ACTION_META[m.action];
              const Icon = a.icon;
              return (
                <li key={m.id} className="relative">
                  <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-base text-leaf-dark shadow-neu-xs">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold text-ink">{istDateShort(m.at)}</span>
                    <span className="text-xs text-ink-faint">{istTime(m.at)} IST</span>
                  </div>
                  <p className="text-sm text-ink">
                    <span className={cn("font-semibold", a.cls)}>{a.label}</span>{" "}
                    {fmt(m.quantity)} {m.crop}
                    {m.action === "MOVE" && m.fromRack && m.toRack
                      ? ` · Rack ${m.fromRack} → ${m.toRack}`
                      : m.toRack
                      ? ` · Rack ${m.toRack}`
                      : ""}
                  </p>
                  <p className="text-xs text-ink-faint">by {m.by}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <span className="text-leaf-dark">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}
