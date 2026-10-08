"use client";

import { Mail, ShieldCheck, MapPin, BadgeCheck, KeyRound } from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { Card } from "@/components/ui";
import { warehouses } from "@/lib/demo-data";
import { istDateShort } from "@/lib/time";
import { fmt } from "@/lib/format";

export default function ProfilePage() {
  const { user, batches, movements, audit } = useStore();
  const { toast } = useToast();
  if (!user) return null;

  const assigned = warehouses.filter((w) => user.warehouseIds.includes(w.id));
  const myActions = audit.filter((a) => a.user === user.name).length;
  const inScope = batches.filter((b) => user.warehouseIds.includes(b.warehouseId)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-black tracking-tight text-ink">User Profile</h1>

      <Card className="p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-base text-2xl font-black text-leaf-dark shadow-neu">
            {user.avatarInitials}
          </span>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-black text-ink">{user.name}</h2>
              <span className="neu-chip bg-leaf/15 text-leaf-dark">
                <BadgeCheck className="h-3.5 w-3.5" /> {user.role}
              </span>
            </div>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink-soft sm:justify-start">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Member since {istDateShort(audit[audit.length - 1]?.at ?? new Date().toISOString())}
            </p>
          </div>
          <button
            onClick={() => toast("info", "Password change", "Your backend would handle secure password reset.")}
            className="neu-btn text-sm"
          >
            <KeyRound className="h-4 w-4" /> Change password
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Batches in scope" value={fmt(inScope)} />
          <Stat label="Movements" value={fmt(movements.filter((m) => m.by === user.name).length)} />
          <Stat label="Your actions" value={fmt(myActions)} />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
          <MapPin className="h-4 w-4 text-leaf-dark" /> Assigned warehouses
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {assigned.map((w) => (
            <div key={w.id} className="neu-inset-sm flex items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-base text-xs font-black text-leaf-dark shadow-neu-xs">
                {w.code}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{w.name}</p>
                <p className="text-[11px] text-ink-faint">{w.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-ink">
          <ShieldCheck className="h-4 w-4 text-leaf-dark" /> Permissions
        </h3>
        <p className="text-sm text-ink-soft">
          Your access is granted by your <b>{user.role}</b> role and enforced both in the interface
          and at the database level (Row Level Security). Contact an administrator to request
          changes.
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-base px-3 py-3 text-center shadow-inset-sm">
      <p className="text-xl font-black text-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
