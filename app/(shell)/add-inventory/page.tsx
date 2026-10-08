"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  Keyboard,
  PackagePlus,
  CalendarClock,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { Card } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { CATEGORIES } from "@/lib/selectors";
import { warehouses, warehouseRacks } from "@/lib/demo-data";
import { referenceDaysFor } from "@/lib/freshness";
import { istDate, istTime } from "@/lib/time";
import type { Category, StorageType } from "@/lib/types";
import { cn } from "@/lib/cn";

const UNITS = ["kg", "quintal", "tonne", "piece", "box", "litre"];
const STORAGE_TYPES: StorageType[] = ["Ambient", "Cold Storage", "Humidity Controlled"];

export default function AddInventoryPage() {
  const router = useRouter();
  const { addBatch, accessibleWarehouseIds, activeWarehouseId, batches, can } = useStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<"scan" | "manual">("manual");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    crop: "",
    category: "Vegetables" as Category,
    quantity: "",
    unit: "kg",
    id: "",
    warehouseId: activeWarehouseId || accessibleWarehouseIds[0] || warehouses[0].id,
    rack: "",
    storageType: "Ambient" as StorageType,
    notes: "",
  });

  useEffect(() => {
    if (!can("add_inventory")) router.replace("/dashboard");
  }, [can, router]);

  const rackOptions = useMemo(
    () => (warehouseRacks[form.warehouseId] ?? []).flatMap((s) => s.racks),
    [form.warehouseId]
  );

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function runScan() {
    setScanning(true);
    // Simulated single scan of an EXISTING tag. We never generate codes.
    setTimeout(() => {
      const existing = batches.find(
        (b) => b.id.toLowerCase() === scanCode.trim().toLowerCase()
      );
      setScanning(false);
      setScanOpen(false);
      if (existing) {
        setForm((f) => ({
          ...f,
          id: existing.id,
          crop: existing.crop,
          category: existing.category,
          warehouseId: existing.warehouseId,
          rack: existing.rack,
          storageType: existing.storageType,
        }));
        toast(
          "info",
          "Batch identified from scan",
          `${existing.crop} · ${existing.id}. Confirm details, you don't need to scan again.`
        );
      } else {
        setForm((f) => ({ ...f, id: scanCode.trim().toUpperCase() }));
        toast("info", "New code", "New batch number set — complete the details below.");
      }
      setScanCode("");
    }, 900);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.crop.trim()) e.crop = "Crop name is required";
    const qty = Number(form.quantity);
    if (!form.quantity.trim()) e.quantity = "Quantity is required";
    else if (!Number.isFinite(qty) || qty <= 0) e.quantity = "Must be greater than zero";
    else if (qty > 1_000_000) e.quantity = "That quantity looks impossible";
    if (!form.id.trim()) e.id = "Batch / unit number is required";
    else if (!/^[A-Za-z0-9-]{2,20}$/.test(form.id.trim()))
      e.id = "2–20 letters, digits or dashes";
    else if (batches.some((b) => b.id.toLowerCase() === form.id.trim().toLowerCase()))
      e.id = "That batch already exists";
    if (!form.rack) e.rack = "Select a rack / location";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      toast("error", "Check the form", "Some fields need your attention.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const res = addBatch({
        crop: form.crop,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        id: form.id,
        warehouseId: form.warehouseId,
        rack: form.rack,
        storageType: form.storageType,
        notes: form.notes,
      });
      setBusy(false);
      if (!res.ok) {
        toast("error", "Could not save", res.error);
        return;
      }
      const id = form.id.trim().toUpperCase();
      toast("success", "Inventory added", `${form.crop} · ${id} stored just now.`);
      router.push(`/batch/${id}`);
    }, 500);
  }

  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Add Inventory</h1>
        <p className="text-sm text-ink-soft">
          Scan an existing tag once, or enter details manually. Storage date &amp; time are captured
          automatically.
        </p>
      </div>

      {/* Method toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("manual")}
          className={cn("neu-btn", mode === "manual" && "!shadow-inset text-leaf-dark")}
        >
          <Keyboard className="h-4 w-4" /> Manual entry
        </button>
        <button
          onClick={() => {
            setMode("scan");
            setScanOpen(true);
          }}
          className={cn("neu-btn", mode === "scan" && "text-leaf-dark")}
        >
          <ScanLine className="h-4 w-4" /> Scan QR / barcode
        </button>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Crop name" error={errors.crop}>
              <input
                className="neu-input"
                value={form.crop}
                onChange={(e) => set("crop", e.target.value)}
                placeholder="e.g. Tomato"
              />
            </Field>
            <Field label="Category">
              <select
                className="neu-input"
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Quantity" error={errors.quantity}>
              <div className="flex gap-2">
                <input
                  className="neu-input"
                  inputMode="decimal"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0"
                />
                <select
                  className="neu-input !w-28"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Batch / unit number" error={errors.id}>
              <input
                className="neu-input font-mono"
                value={form.id}
                onChange={(e) => set("id", e.target.value.toUpperCase())}
                placeholder="e.g. T102"
              />
            </Field>

            <Field label="Warehouse">
              <select
                className="neu-input"
                value={form.warehouseId}
                onChange={(e) => {
                  set("warehouseId", e.target.value);
                  set("rack", "");
                }}
              >
                {accessibleWarehouseIds.map((id) => {
                  const w = warehouses.find((x) => x.id === id);
                  return (
                    <option key={id} value={id}>
                      {w?.name ?? id}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Rack / location" error={errors.rack}>
              <select
                className="neu-input"
                value={form.rack}
                onChange={(e) => set("rack", e.target.value)}
              >
                <option value="">Select a rack…</option>
                {rackOptions.map((r) => (
                  <option key={r} value={r}>
                    Rack {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Storage type">
              <select
                className="neu-input"
                value={form.storageType}
                onChange={(e) => set("storageType", e.target.value as StorageType)}
              >
                {STORAGE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input
                className="neu-input"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Source, grade, remarks…"
              />
            </Field>
          </div>

          {form.crop && (
            <div className="neu-inset-sm flex items-center gap-2 px-3 py-2 text-xs text-ink-soft">
              <ShieldAlert className="h-4 w-4 shrink-0 text-sky" />
              Reference storage window for {form.crop}: about{" "}
              {referenceDaysFor(form.crop)} days. Freshness status will be estimated from this.
            </div>
          )}

          {/* Auto timestamp preview */}
          <div className="neu-inset flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-base text-leaf-dark shadow-neu-sm">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Stored On — captured automatically</p>
              <p className="text-xs text-ink-soft">
                {istDate(now)} · {istTime(now)} IST. You don’t enter date or time manually.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => router.back()} className="neu-btn">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="neu-btn-primary">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" /> Save batch
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Scan modal (input only — never generates codes) */}
      <Modal open={scanOpen} onClose={() => setScanOpen(false)} title="Scan existing QR / barcode" className="max-w-md">
        <div className="space-y-4">
          <div className="grid aspect-video place-items-center rounded-xl2 bg-ink/5 shadow-inset-sm">
            {scanning ? (
              <div className="flex flex-col items-center gap-2 text-ink-soft">
                <Loader2 className="h-7 w-7 animate-spin text-leaf" />
                <span className="text-sm">Scanning…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-ink-faint">
                <ScanLine className="h-10 w-10" />
                <span className="text-xs">Point at an existing batch tag</span>
              </div>
            )}
          </div>
          <div>
            <label className="neu-label">Or type / paste the batch code</label>
            <div className="flex gap-2">
              <input
                className="neu-input font-mono"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scanCode.trim() && runScan()}
                placeholder="e.g. P101"
              />
              <button
                className="neu-btn-primary"
                onClick={runScan}
                disabled={!scanCode.trim() || scanning}
              >
                Scan
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-faint">
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-leaf" />
            Scanning is optional and only identifies a batch once — you won’t need to scan again to
            review stock.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="neu-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-chili">{error}</p>}
    </div>
  );
}
