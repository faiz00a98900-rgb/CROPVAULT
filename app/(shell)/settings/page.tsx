"use client";

import { useEffect, useState } from "react";
import {
  UserRound,
  Warehouse as WhIcon,
  Bell,
  Tags,
  Users,
  ShieldCheck,
  Lock,
  CloudUpload,
  Loader2,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { Card } from "@/components/ui";
import { Modal } from "@/components/Modal";
import {
  warehouses,
  users as allUsers,
  warehouseRacks,
  userFromProfile,
} from "@/lib/demo-data";
import { CATEGORIES } from "@/lib/selectors";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/cn";
import { getSupabase } from "@/lib/supabase";
import type { Role, User } from "@/lib/types";

type TabKey = "profile" | "warehouses" | "notifications" | "categories" | "users" | "security";

export default function SettingsPage() {
  const { user, can } = useStore();
  const { toast } = useToast();

  const tabs: { key: TabKey; label: string; icon: typeof UserRound; managerOnly?: boolean }[] = [
    { key: "profile", label: "Profile", icon: UserRound },
    { key: "warehouses", label: "Warehouse Settings", icon: WhIcon },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "categories", label: "Categories", icon: Tags },
    { key: "users", label: "User Management", icon: Users, managerOnly: true },
    { key: "security", label: "Security Settings", icon: ShieldCheck },
  ];
  const visibleTabs = tabs.filter((t) => !t.managerOnly || can("manage_users"));
  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-soft">Manage your account and system configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        {/* Tab rail */}
        <Card className="h-max p-2">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  data-active={active}
                  className={cn("neu-nav-item shrink-0 whitespace-nowrap", active && "text-leaf-dark")}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Panel */}
        <div className="space-y-4">
          {tab === "profile" && <ProfilePanel name={user?.name ?? ""} email={user?.email ?? ""} onSave={() => toast("success", "Profile saved")} />}
          {tab === "warehouses" && <WarehousePanel onToast={toast} />}
          {tab === "notifications" && <NotificationPanel />}
          {tab === "categories" && <CategoryPanel onToast={toast} />}
          {tab === "users" && can("manage_users") && <UserPanel onToast={toast} />}
          {tab === "security" && <SecurityPanel onToast={toast} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function Toggle({
  label,
  desc,
  defaultOn,
  onChange,
}: {
  label: string;
  desc?: string;
  defaultOn?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {desc && <p className="text-xs text-ink-soft">{desc}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        onClick={() => {
          const v = !on;
          setOn(v);
          onChange?.(v);
        }}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full bg-base shadow-inset-sm transition",
          on && "!shadow-inset"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-base shadow-neu-xs transition-all",
            on ? "left-6 bg-leaf" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function PanelHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {desc && <p className="text-sm text-ink-soft">{desc}</p>}
    </div>
  );
}

/* ---------- panels ---------- */
function ProfilePanel({
  name,
  email,
  onSave,
}: {
  name: string;
  email: string;
  onSave: () => void;
}) {
  return (
    <Card className="p-5">
      <PanelHead title="Profile" desc="Your account details." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="neu-label">Full name</label>
          <input className="neu-input" defaultValue={name} />
        </div>
        <div>
          <label className="neu-label">Email</label>
          <input className="neu-input" defaultValue={email} readOnly />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="neu-btn-primary" onClick={onSave}>
          <CloudUpload className="h-4 w-4" /> Save changes
        </button>
      </div>
    </Card>
  );
}

function WarehousePanel({ onToast }: { onToast: ReturnType<typeof useToast>["toast"] }) {
  const { can, accessibleWarehouseIds } = useStore();
  const editable = can("manage_warehouses");
  const list = warehouses.filter((w) => accessibleWarehouseIds.includes(w.id));
  return (
    <Card className="p-5">
      <PanelHead title="Warehouse Settings" desc="Facilities, capacity and rack layout." />
      <div className="space-y-3">
        {list.map((w) => {
          const rackCount = (warehouseRacks[w.id] ?? []).reduce((n, s) => n + s.racks.length, 0);
          return (
            <div key={w.id} className="neu-inset-sm flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-base text-sm font-black text-leaf-dark shadow-neu-xs">
                {w.code}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{w.name}</p>
                <p className="text-[11px] text-ink-faint">
                  {w.sections.length} sections · {rackCount} racks · {fmt(w.capacity)} kg capacity
                </p>
              </div>
              <button
                disabled={!editable}
                onClick={() => onToast("info", "Edit warehouse", `${w.name}`)}
                className="neu-btn !py-1.5 text-xs"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
      {!editable && (
        <p className="mt-3 text-xs text-ink-faint">You have view-only access to warehouse settings.</p>
      )}
    </Card>
  );
}

function NotificationPanel() {
  const { toast } = useToast();
  return (
    <Card className="divide-y divide-white/40 p-5">
      <PanelHead title="Notification Settings" desc="Choose what you get alerted about." />
      <Toggle label="Freshness / Sell Soon" desc="Notify when a batch approaches its window." defaultOn onChange={(v) => toast(v ? "success" : "info", `Sell Soon alerts ${v ? "on" : "off"}`)} />
      <Toggle label="Urgent & Critical" desc="High freshness risk and inspection alerts." defaultOn onChange={(v) => toast(v ? "success" : "info", `Urgent alerts ${v ? "on" : "off"}`)} />
      <Toggle label="Low stock" desc="When a batch falls below its threshold." defaultOn onChange={(v) => toast(v ? "success" : "info", `Low stock alerts ${v ? "on" : "off"}`)} />
      <Toggle label="Daily summary" desc="A digest of stock movement each evening." />
    </Card>
  );
}

function CategoryPanel({ onToast }: { onToast: ReturnType<typeof useToast>["toast"] }) {
  return (
    <Card className="p-5">
      <PanelHead title="Categories" desc="Crop categories used across the system." />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <span key={c} className="neu-chip !py-2 !px-3 bg-base text-ink shadow-inset-sm">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="neu-btn" onClick={() => onToast("info", "Add category", "Category management would persist to your backend.")}>
          + Add category
        </button>
      </div>
    </Card>
  );
}

const ROLE_OPTIONS: Role[] = ["WAREHOUSE WORKER", "MANAGER"];

/** Normalize a DB role value to the app's Role union. */
function normalizeRole(role: unknown): Role {
  const r = String(role ?? "")
    .toUpperCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
  // "ADMIN" is legacy — it now maps to the top role, MANAGER.
  if (r === "MANAGER" || r === "ADMIN") return "MANAGER";
  return "WAREHOUSE WORKER";
}

function whName(id: string): string {
  return warehouses.find((w) => w.id === id)?.name ?? id;
}

function UserPanel({ onToast }: { onToast: ReturnType<typeof useToast>["toast"] }) {
  const { user: currentUser } = useStore();
  const [rows, setRows] = useState<User[]>(allUsers);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [draft, setDraft] = useState<{ role: Role; warehouseIds: string[] }>({
    role: "WAREHOUSE WORKER",
    warehouseIds: [],
  });

  // Load the live, authoritative user list from the Supabase `profiles` table.
  // RLS lets a MANAGER (the top role) read every profile; if Supabase is unavailable we fall
  // back to the static demo roster so the panel still renders.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setRows(allUsers);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await sb
        .from("profiles")
        .select("id, email, full_name, role, warehouse_ids")
        .order("created_at");
      if (!mounted) return;
      if (error || !data || !data.length) {
        if (error) onToast("warning", "Showing demo roster", error.message);
        setRows(allUsers);
      } else {
        setRows(
          data.map((p) =>
            userFromProfile(String(p.id), (p.email as string) ?? "", {
              name: (p.full_name as string) || ((p.email as string) ?? "").split("@")[0] || "User",
              role: normalizeRole(p.role),
              warehouseIds: Array.isArray(p.warehouse_ids) ? (p.warehouse_ids as string[]) : [],
            })
          )
        );
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openManage(u: User) {
    setSelected(u);
    setDraft({ role: u.role, warehouseIds: [...u.warehouseIds] });
  }

  function toggleWarehouse(id: string) {
    setDraft((d) => ({
      ...d,
      warehouseIds: d.warehouseIds.includes(id)
        ? d.warehouseIds.filter((w) => w !== id)
        : [...d.warehouseIds, id],
    }));
  }

  const isSelf = selected?.id === currentUser?.id;

  async function saveChanges() {
    if (!selected) return;
    if (!draft.warehouseIds.length) {
      onToast("error", "Assign at least one warehouse", "A user needs a scope to work in.");
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      onToast("error", "Not connected", "Supabase is not configured, so changes can’t be saved.");
      return;
    }
    setSaving(true);
    const { error } = await sb
      .from("profiles")
      .update({ role: draft.role, warehouse_ids: draft.warehouseIds })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      onToast("error", "Could not update user", error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, role: draft.role, warehouseIds: draft.warehouseIds } : r
      )
    );
    onToast("success", "User updated", `${selected.name} · ${draft.role}`);
    setSelected(null);
  }

  return (
    <Card className="p-5">
      <PanelHead title="User Management" desc="Manage users and their roles (Manager only)." />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/50 text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="py-2 font-semibold">User</th>
              <th className="py-2 font-semibold">Role</th>
              <th className="py-2 font-semibold">Warehouses</th>
              <th className="py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/30">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-base text-xs font-bold text-leaf-dark shadow-inset-sm">
                      {u.avatarInitials}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-[11px] text-ink-faint">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="neu-chip bg-leaf/10 text-leaf-dark">{u.role}</span>
                </td>
                <td className="py-3 text-ink-soft">{u.warehouseIds.join(", ")}</td>
                <td className="py-3 text-right">
                  <button
                    className="neu-btn !py-1.5 text-xs"
                    disabled={loading}
                    onClick={() => openManage(u)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-ink-faint">
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading users…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!selected}
        onClose={() => !saving && setSelected(null)}
        title={selected ? `Manage — ${selected.name}` : "Manage user"}
        className="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <p className="text-xs text-ink-faint">{selected.email}</p>

            <div>
              <label className="neu-label">Role</label>
              <select
                className="neu-input"
                value={draft.role}
                disabled={isSelf}
                onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as Role }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {isSelf && (
                <p className="mt-1 text-[11px] text-amber">
                  You can’t change your own role — that would risk locking yourself out.
                </p>
              )}
            </div>

            <div>
              <label className="neu-label">Assigned warehouses</label>
              <div className="space-y-1">
                {warehouses.map((w) => {
                  const on = draft.warehouseIds.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        on ? "bg-leaf/10 text-ink" : "hover:bg-white/40 text-ink-soft"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-leaf"
                        checked={on}
                        onChange={() => toggleWarehouse(w.id)}
                      />
                      <span className="font-medium">{whName(w.id)}</span>
                      <span className="ml-auto text-[11px] text-ink-faint">{w.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button className="neu-btn" onClick={() => setSelected(null)} disabled={saving}>
                Cancel
              </button>
              <button className="neu-btn-primary" onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function SecurityPanel({ onToast }: { onToast: ReturnType<typeof useToast>["toast"] }) {
  return (
    <Card className="p-5">
      <PanelHead title="Security Settings" desc="Authentication and data protection." />
      <div className="divide-y divide-white/40">
        <Toggle label="Two-factor authentication" desc="Require a second factor at login." defaultOn onChange={(v) => onToast(v ? "success" : "warning", `2FA ${v ? "enabled" : "disabled"}`)} />
        <Toggle label="Session timeout" desc="Auto sign-out after inactivity." defaultOn />
        <Toggle label="Audit logging" desc="Record all important inventory actions." defaultOn />
      </div>
      <div className="neu-inset mt-4 flex items-start gap-3 p-4 text-xs text-ink-soft">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
        <p>
          Secrets, service-role keys and database passwords are never stored in the frontend. All
          external services use environment variables, and authorization is enforced at the database
          level with Row Level Security.
        </p>
      </div>
    </Card>
  );
}
