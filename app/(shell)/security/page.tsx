"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Users,
  Activity,
  ScrollText,
  Check,
  Lock,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { istDateShort, istTime, timeAgo } from "@/lib/time";
import { fmt } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";

const ROLES: Role[] = ["MANAGER", "WAREHOUSE WORKER"];

const MATRIX: { label: string; manager: boolean; worker: boolean }[] = [
  { label: "View inventory", manager: true, worker: true },
  { label: "Add inventory", manager: true, worker: true },
  { label: "Record movement / sell", manager: true, worker: false },
  { label: "View reports", manager: true, worker: true },
  { label: "Approve actions", manager: true, worker: false },
  { label: "Manage warehouses", manager: true, worker: false },
  { label: "Manage users", manager: true, worker: false },
  { label: "Manage permissions", manager: true, worker: false },
  { label: "System configuration", manager: true, worker: false },
];

export default function SecurityPage() {
  const { user, audit, accessibleWarehouseIds } = useStore();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"activity" | "audit">("activity");

  const lastLogin = audit.find((a) => a.action === "Signed in");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("page.security.title")}</h1>
        <p className="text-sm text-ink-soft">
          {t("page.security.subtitle")}
        </p>
      </div>

      {/* Status tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Status
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Security Status"
          value="System Secure"
          tone="leaf"
          dot
        />
        <Status icon={<Fingerprint className="h-5 w-5" />} label="Authentication" value="Enabled" tone="leaf" />
        <Status icon={<KeyRound className="h-5 w-5" />} label="Role-Based Access" value="Enabled" tone="leaf" />
        <Status icon={<Users className="h-5 w-5" />} label="Session Status" value="Active" tone="sky" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Session + last login */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 text-base font-bold text-ink">Session</h2>
          <div className="space-y-3">
            <Row label="Signed in as" value={user?.name ?? "—"} />
            <Row label="Role" value={user?.role ?? "—"} />
            <Row
              label="Last login"
              value={lastLogin ? `${istDateShort(lastLogin.at)}, ${istTime(lastLogin.at)} IST` : "—"}
            />
            <Row label="Access scope" value={`${accessibleWarehouseIds.length} warehouses`} />
          </div>
          <div className="neu-inset-sm mt-4 flex items-start gap-2 p-3 text-xs text-ink-soft">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
            <span>
              Permissions are enforced in the UI <b>and</b> at the database layer via Row Level
              Security. No service-role keys or secrets are ever exposed to the frontend.
            </span>
          </div>
        </Card>

        {/* RBAC matrix */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-ink">Role-Based Access Control</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-4 font-semibold">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-2 text-center font-semibold">
                      {r === "WAREHOUSE WORKER" ? "Worker" : r[0] + r.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.label} className="border-t border-white/40">
                    <td className="py-2.5 pr-4 font-medium text-ink">{row.label}</td>
                    <RbacCell allowed={row.manager} />
                    <RbacCell allowed={row.worker} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Activity / Audit */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setTab("activity")}
            className={cn("neu-btn !py-2 text-sm", tab === "activity" && "!shadow-inset text-leaf-dark")}
          >
            <Activity className="h-4 w-4" /> Recent Security Activity
          </button>
          <button
            onClick={() => setTab("audit")}
            className={cn("neu-btn !py-2 text-sm", tab === "audit" && "!shadow-inset text-leaf-dark")}
          >
            <ScrollText className="h-4 w-4" /> Audit Log
          </button>
          <span className="ml-auto text-xs text-ink-faint">{fmt(audit.length)} entries</span>
        </div>

        {tab === "activity" ? (
          <ol className="space-y-3">
            {audit.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf shadow-neu-xs" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <b>{a.user}</b>{" "}
                    <span className="text-ink-soft">{a.action.toLowerCase()}</span>{" "}
                    {a.detail ? <span className="text-ink-soft">— {a.detail}</span> : null}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {a.role} · {timeAgo(a.at)} · {istTime(a.at)} IST
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/50 text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-4 font-semibold">Who</th>
                  <th className="py-2 pr-4 font-semibold">Action</th>
                  <th className="py-2 pr-4 font-semibold">Detail</th>
                  <th className="py-2 font-semibold">When (IST)</th>
                </tr>
              </thead>
              <tbody>
                {audit.slice(0, 25).map((a) => (
                  <tr key={a.id} className="border-b border-white/30">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-ink">{a.user}</span>
                      <span className="block text-[11px] text-ink-faint">{a.role}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">
                      {a.action}
                      {a.batchId && (
                        <span className="ml-1 font-mono text-[11px] text-sky">{a.batchId}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">{a.detail}</td>
                    <td className="whitespace-nowrap py-2.5 text-ink-soft">
                      {istDateShort(a.at)} · {istTime(a.at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Status({
  icon,
  label,
  value,
  tone,
  dot,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "leaf" | "sky";
  dot?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-base shadow-neu-sm", tone === "leaf" ? "text-leaf-dark" : "text-sky")}>
        {icon}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn("flex items-center gap-1.5 text-sm font-bold", tone === "leaf" ? "text-leaf-dark" : "text-ink")}>
        {dot && <span className="h-2 w-2 rounded-full bg-leaf" />}
        {value}
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function RbacCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-3 py-2.5 text-center">
      {allowed ? (
        <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-leaf/15 text-leaf">
          <Check className="h-4 w-4" />
        </span>
      ) : (
        <span className="mx-auto h-6 w-6 rounded-full bg-base shadow-inset-sm" />
      )}
    </td>
  );
}
