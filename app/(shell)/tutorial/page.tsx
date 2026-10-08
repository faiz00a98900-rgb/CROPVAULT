"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  BellRing,
  BarChart3,
  Warehouse as WhIcon,
  PackagePlus,
  ArrowLeftRight,
  Eye,
  Globe,
  GraduationCap,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  IllusDashboard,
  IllusWarehouseSwitch,
  IllusAddInventory,
  IllusMovement,
  IllusAlerts,
  IllusReports,
  IllusSecurity,
  IllusLanguage,
} from "@/components/tutorial-illustrations";

type Role = "worker" | "manager";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  Illus: () => JSX.Element;
}

const WORKER_STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Open your dashboard",
    body: "After signing in you land on the Dashboard. It shows your warehouse at a glance — total stock, batch count and anything that needs attention. Use the warehouse selector in the top bar to switch between the warehouses you are assigned to.",
    Illus: IllusDashboard,
  },
  {
    icon: WhIcon,
    title: "Stay inside your warehouse",
    body: "As a worker you only see the warehouses assigned to you. Tap a warehouse card to open its inventory, racks and sections. Everything you view is automatically scoped to your access.",
    Illus: IllusWarehouseSwitch,
  },
  {
    icon: PackagePlus,
    title: "Add inventory (scan or manual)",
    body: "Go to Add Inventory. You can scan an existing QR/barcode once to identify a batch, or fill the form manually — crop, category, quantity, unit, rack and storage type. The storage date and time are captured automatically.",
    Illus: IllusAddInventory,
  },
  {
    icon: Eye,
    title: "View & filter inventory",
    body: "Open Inventory to browse every batch in your scope. Search by crop, batch or rack, and filter by category, warehouse, location and freshness status. Tap any row to see full batch details and history.",
    Illus: IllusMovement,
  },
  {
    icon: BellRing,
    title: "Understand alerts",
    body: "The Alerts page lists batches that need action (low stock, sell soon, inspection required). Workers can open and review them, but only a manager can mark an alert as In Review or Resolved.",
    Illus: IllusAlerts,
  },
  {
    icon: Globe,
    title: "Change the language",
    body: "Use the language selector in the top bar to switch between English, हिन्दी (Hindi) and मराठी (Marathi). Your choice is remembered on this device. English is the default.",
    Illus: IllusLanguage,
  },
];

const MANAGER_STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Control the whole operation",
    body: "The Dashboard gives a manager a full overview across every warehouse — KPIs, inventory by category, a live activity feed and a prioritised Needs Attention list. Switch warehouses from the top bar to drill into any site.",
    Illus: IllusDashboard,
  },
  {
    icon: WhIcon,
    title: "Oversee all warehouses",
    body: "Managers can access and switch between all warehouses. Open the Warehouses screen to compare stock, rack occupancy and alert load, then jump straight into any warehouse's inventory.",
    Illus: IllusWarehouseSwitch,
  },
  {
    icon: PackagePlus,
    title: "Add & manage inventory",
    body: "Add new batches through the Add Inventory screen — scan a tag or enter details manually. As a manager you can add stock to any warehouse in your scope.",
    Illus: IllusAddInventory,
  },
  {
    icon: ArrowLeftRight,
    title: "Record stock movements",
    body: "Stock Movement is where a manager sells, moves, removes or disposes of stock. Pick a batch, choose the action, enter a quantity and confirm. Every action writes a timestamped, auditable record and updates the shared stock level instantly.",
    Illus: IllusMovement,
  },
  {
    icon: BellRing,
    title: "Review & resolve alerts",
    body: "On the Alerts page a manager can change an alert's state — mark it In Review or Resolved. Because alert states are stored centrally, the update is reflected for every worker across all devices within seconds.",
    Illus: IllusAlerts,
  },
  {
    icon: BarChart3,
    title: "Read reports & analytics",
    body: "Reports turn your stock, movement and freshness data into charts and summaries so you can spot trends, ageing batches and under-performing warehouses at a glance.",
    Illus: IllusReports,
  },
  {
    icon: ShieldCheck,
    title: "Manage users & security",
    body: "The Security Center lets a manager add and edit users, assign roles and warehouses, and review the full audit trail of every inventory change. Role-based access is enforced everywhere.",
    Illus: IllusSecurity,
  },
];

export default function TutorialPage() {
  const { t } = useLanguage();
  const [role, setRole] = useState<Role | null>(null);

  const steps = role === "manager" ? MANAGER_STEPS : WORKER_STEPS;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-base text-leaf-dark shadow-neu-sm">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{t("tutorial.title")}</h1>
          <p className="text-sm text-ink-soft">{t("tutorial.subtitle")}</p>
        </div>
      </div>

      {!role ? (
        <RoleChooser
          onPick={setRole}
          title={t("tutorial.choose")}
          hint={t("tutorial.chooseHint")}
          workerLabel={t("tutorial.worker")}
          managerLabel={t("tutorial.manager")}
          workerTag={t("tutorial.workerTag")}
          managerTag={t("tutorial.managerTag")}
          start={t("tutorial.start")}
        />
      ) : (
        <div className="space-y-4">
          <button onClick={() => setRole(null)} className="neu-btn !px-3 !py-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> {t("tutorial.back")}
          </button>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "neu-chip",
                role === "manager" ? "bg-leaf/10 text-leaf-dark" : "bg-sky/10 text-sky"
              )}
            >
              {role === "manager" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
              {role === "manager" ? t("tutorial.manager") : t("tutorial.worker")}
            </span>
            <span className="text-xs text-ink-faint">
              {steps.length} {t("tutorial.stepsCount")}
            </span>
          </div>

          <ol className="space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const Illus = s.Illus;
              return (
                <li key={s.title}>
                  <Card className="fade-up overflow-hidden p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="order-2 p-5 md:order-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-base text-leaf-dark shadow-neu-xs">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                            {t("tutorial.step")} {i + 1}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-ink">{s.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                      </div>
                      <div className="order-1 flex items-center bg-white/30 p-4 md:order-2">
                        <Illus />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <div className="flex items-center justify-center gap-2 pt-2 text-ink-faint">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm">
              {role === "manager" ? t("tutorial.managerDone") : t("tutorial.workerDone")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleChooser({
  onPick,
  title,
  hint,
  workerLabel,
  managerLabel,
  workerTag,
  managerTag,
  start,
}: {
  onPick: (r: Role) => void;
  title: string;
  hint: string;
  workerLabel: string;
  managerLabel: string;
  workerTag: string;
  managerTag: string;
  start: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="text-sm text-ink-soft">{hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RoleCard
          accent="sky"
          icon={UserRound}
          label={workerLabel}
          tag={workerTag}
          start={start}
          illus={<IllusAddInventory />}
          onClick={() => onPick("worker")}
        />
        <RoleCard
          accent="leaf"
          icon={ShieldCheck}
          label={managerLabel}
          tag={managerTag}
          start={start}
          illus={<IllusDashboard />}
          onClick={() => onPick("manager")}
        />
      </div>
    </div>
  );
}

function RoleCard({
  accent,
  icon: Icon,
  label,
  tag,
  start,
  illus,
  onClick,
}: {
  accent: "leaf" | "sky";
  icon: LucideIcon;
  label: string;
  tag: string;
  start: string;
  illus: JSX.Element;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left"
    >
      <Card
        className={cn(
          "fade-up h-full p-5 transition hover:shadow-neu active:shadow-pressed",
          accent === "leaf" ? "ring-1 ring-leaf/20" : "ring-1 ring-sky/20"
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl bg-base shadow-neu-sm",
              accent === "leaf" ? "text-leaf-dark" : "text-sky"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-black text-ink">{label}</p>
            <p className="text-xs text-ink-faint">{tag}</p>
          </div>
        </div>
        <div className="mb-4">{illus}</div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-bold",
            accent === "leaf" ? "text-leaf-dark" : "text-sky"
          )}
        >
          {start}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </Card>
    </button>
  );
}
