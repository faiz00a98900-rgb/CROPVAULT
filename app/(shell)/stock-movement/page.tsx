"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PackagePlus,
  ArrowLeftRight,
  ShoppingCart,
  MinusCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { useLanguage } from "@/lib/i18n";
import { Card, EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/Modal";
import { warehouseRacks, warehouses, cropEmoji } from "@/lib/demo-data";
import { istDateShort, istTime } from "@/lib/time";
import { fmt } from "@/lib/format";
import type { MovementAction } from "@/lib/types";
import { cn } from "@/lib/cn";

const ACTIONS: {
  key: MovementAction;
  label: string;
  icon: typeof PackagePlus;
  tone: string;
  needsRack?: boolean;
  reduces?: boolean;
}[] = [
  { key: "ADD", label: "Add Stock", icon: PackagePlus, tone: "text-leaf" },
  { key: "MOVE", label: "Move Stock", icon: ArrowLeftRight, tone: "text-sky", needsRack: true },
  { key: "SELL", label: "Sell Stock", icon: ShoppingCart, tone: "text-amber", reduces: true },
  { key: "REMOVE", label: "Remove Stock", icon: MinusCircle, tone: "text-chili", reduces: true },
  { key: "DISPOSE", label: "Dispose Stock", icon: Trash2, tone: "text-chili", reduces: true },
];

function MovementInner() {
  const params = useSearchParams();
  const { visibleBatches, movements, recordMovement, can } = useStore();
  const { toast } = useToast();
  const { t, tl } = useLanguage();

  const [batchId, setBatchId] = useState(params.get("batch") ?? "");
  const [action, setAction] = useState<MovementAction>(
    (params.get("action") as MovementAction) ?? "SELL"
  );
  const [qty, setQty] = useState("");
  const [toRack, setToRack] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const b = params.get("batch");
    const a = params.get("action");
    if (b) setBatchId(b);
    if (a) setAction(a as MovementAction);
  }, [params]);

  const batch = visibleBatches.find((b) => b.id.toLowerCase() === batchId.toLowerCase());
  const selected = ACTIONS.find((a) => a.key === action)!;
  const rackOptions = batch
    ? (warehouseRacks[batch.warehouseId] ?? []).flatMap((s) => s.racks).filter((r) => r !== batch.rack)
    : [];

  function doRecord() {
    if (!batch) {
      setErr("Select a batch first.");
      return;
    }
    const q = Number(qty);
    if (!qty.trim() || !Number.isFinite(q) || q <= 0) {
      setErr("Enter a quantity greater than zero.");
      return;
    }
    if (selected.reduces && q > batch.quantity) {
      setErr(`Only ${batch.quantity} ${batch.unit} available.`);
      return;
    }
    if (selected.needsRack && !toRack) {
      setErr("Choose a destination rack.");
      return;
    }
    setErr(null);
    setBusy(true);
    setTimeout(() => {
      const res = recordMovement({
        batchId: batch.id,
        action,
        quantity: q,
        toRack: toRack || undefined,
      });
      setBusy(false);
      setQty("");
      setToRack("");
      if (!res.ok) {
        toast("error", "Movement failed", res.error);
        return;
      }
      toast("success", `${selected.label} recorded`, `${fmt(q)} ${batch.crop} · ${batch.id}`);
    }, 400);
  }

  function attempt() {
    // Confirmation dialogs for risky operations.
    const risky =
      action === "DISPOSE" ||
      (selected.reduces && batch && Number(qty) > batch.quantity * 0.5);
    if (risky) setConfirm(true);
    else doRecord();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("page.stockMovement.title")}</h1>
        <p className="text-sm text-ink-soft">
          {t("page.stockMovement.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Form */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-base font-bold text-ink">{tl("New movement")}</h2>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => setAction(a.key)}
                  className={cn(
                    "neu-btn !px-3 !py-2 text-xs",
                    action === a.key && "!shadow-inset " + a.tone
                  )}
                >
                  <Icon className="h-4 w-4" /> {tl(a.label)}
                </button>
              );
            })}
          </div>

          <label className="neu-label">{tl("Batch")}</label>
          <select
            className="neu-input mb-3"
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setToRack("");
            }}
          >
            <option value="">{tl("Select batch…")}</option>
            {visibleBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.crop} · {b.id} ({fmt(b.quantity)} {b.unit})
              </option>
            ))}
          </select>

          {batch && (
            <div className="neu-inset-sm mb-3 flex items-center gap-2 px-3 py-2 text-xs text-ink-soft">
              <span className="text-base">{cropEmoji(batch.crop)}</span>
              Current: <b className="text-ink">{fmt(batch.quantity)} {batch.unit}</b> · Rack{" "}
              {batch.rack}
            </div>
          )}

          <label className="neu-label">{tl("Quantity")}</label>
          <input
            className="neu-input mb-3"
            inputMode="decimal"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value.replace(/[^\d.]/g, ""));
              setErr(null);
            }}
            placeholder="0"
          />

          {selected.needsRack && (
            <>
              <label className="neu-label">{tl("Destination rack")}</label>
              <select
                className="neu-input mb-3"
                value={toRack}
                onChange={(e) => setToRack(e.target.value)}
              >
                <option value="">{tl("Select rack…")}</option>
                {rackOptions.map((r) => (
                  <option key={r} value={r}>
                    {tl("Rack")} {r}
                  </option>
                ))}
              </select>
            </>
          )}

          {err && (
            <p className="mb-3 rounded-xl bg-chili/10 px-3 py-2 text-xs font-medium text-chili">
              {err}
            </p>
          )}

          <button
            onClick={attempt}
            disabled={busy || !batch || !can("record_movement")}
            className="neu-btn-primary w-full"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {tl("Recording…")}
              </>
            ) : (
              <>
                <selected.icon className="h-4 w-4" /> {tl(selected.label)}
              </>
            )}
          </button>
          {!can("record_movement") && (
            <p className="mt-2 text-center text-xs text-ink-faint">
              {tl("Your role can’t record movements.")}
            </p>
          )}
        </Card>

        {/* History */}
        <Card className="p-0 lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-bold text-ink">{tl("Movement log")}</h2>
            <span className="text-xs text-ink-faint">{fmt(movements.length)} {tl("records")}</span>
          </div>
          {movements.length === 0 ? (
            <EmptyState title={tl("No movements yet")} message={tl("Recorded actions will appear here.")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-white/50 text-[11px] uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2 font-semibold">{tl("Date")}</th>
                    <th className="px-4 py-2 font-semibold">{tl("Time")}</th>
                    <th className="px-4 py-2 font-semibold">{tl("Action")}</th>
                    <th className="px-4 py-2 text-right font-semibold">{tl("Qty")}</th>
                    <th className="px-4 py-2 font-semibold">{tl("Batch")}</th>
                    <th className="px-4 py-2 font-semibold">{tl("From → To")}</th>
                    <th className="px-4 py-2 font-semibold">{tl("By")}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 40).map((m) => {
                    const a = ACTIONS.find((x) => x.key === m.action)!;
                    return (
                      <tr key={m.id} className="border-b border-white/40 hover:bg-white/30">
                        <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                          {istDateShort(m.at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink-soft">
                          {istTime(m.at)}
                        </td>
                        <td className={cn("whitespace-nowrap px-4 py-2.5 font-semibold", a.tone)}>
                          {tl(a.label)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-ink">
                          {fmt(m.quantity)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className="font-mono text-xs text-ink">{m.batchId}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                          {m.fromRack || m.toRack ? (
                            <>
                              {m.fromRack ? `${m.fromRack} → ` : ""}
                              {m.toRack ?? "—"}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{m.by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirm}
        title={`Confirm ${selected.label.toLowerCase()}`}
        message={
          <>
            You are about to <b>{selected.label.toLowerCase()}</b> {qty || 0}{" "}
            {batch?.unit} of {batch?.crop} ({batch?.id}). This will be recorded in the audit trail
            and cannot be undone.
          </>
        }
        confirmLabel="Yes, record it"
        tone={action === "DISPOSE" ? "danger" : "primary"}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          doRecord();
        }}
      />
    </div>
  );
}

export default function StockMovementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-soft">Loading…</div>}>
      <MovementInner />
    </Suspense>
  );
}
