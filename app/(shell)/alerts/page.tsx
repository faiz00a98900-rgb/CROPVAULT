"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Eye, RotateCcw, ChevronRight } from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { useLanguage } from "@/lib/i18n";
import { Card, EmptyState } from "@/components/ui";
import type { AlertPriority, AlertState, AlertType } from "@/lib/types";
import { fmt } from "@/lib/format";
import { cropEmoji } from "@/lib/demo-data";
import { cn } from "@/lib/cn";

const PRIORITY_STYLE: Record<AlertPriority, string> = {
  Critical: "bg-chili/15 text-chili",
  High: "bg-amber/20 text-amber",
  Medium: "bg-amber/10 text-amber",
  Low: "bg-sky/10 text-sky",
};

const TYPES: (AlertType | "all")[] = [
  "all",
  "SELL SOON",
  "URGENT",
  "LOW STOCK",
  "OLD STOCK",
  "STORAGE DURATION WARNING",
  "INSPECTION REQUIRED",
];

const STATES: (AlertState | "all")[] = ["all", "Open", "In Review", "Resolved"];

export default function AlertsPage() {
  const { alerts, setAlertState, can } = useStore();
  const { toast } = useToast();
  const { t, tl } = useLanguage();
  const [type, setType] = useState<AlertType | "all">("all");
  const [state, setState] = useState<AlertState | "all">("Open");

  const counts = useMemo(
    () => ({
      Open: alerts.filter((a) => a.state === "Open").length,
      "In Review": alerts.filter((a) => a.state === "In Review").length,
      Resolved: alerts.filter((a) => a.state === "Resolved").length,
    }),
    [alerts]
  );

  const rows = alerts.filter(
    (a) => (type === "all" || a.type === type) && (state === "all" || a.state === state)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("page.alerts.title")}</h1>
        <p className="text-sm text-ink-soft">
          {t("page.alerts.subtitle")}
        </p>
      </div>

      {/* Priority summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label={tl("Open")} value={counts.Open} tone="text-chili" />
        <SummaryCard label={tl("In Review")} value={counts["In Review"]} tone="text-amber" />
        <SummaryCard label={tl("Resolved")} value={counts.Resolved} tone="text-leaf" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={cn(
                  "neu-btn !px-3 !py-1.5 text-xs",
                  state === s && "!shadow-inset text-leaf-dark"
                )}
              >
                {tl(s)}
              </button>
            ))}
          </div>
          <select
            className="neu-input sm:ml-auto sm:!w-64"
            value={type}
            onChange={(e) => setType(e.target.value as AlertType | "all")}
          >
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tp === "all" ? tl("All alert types") : tl(tp)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* List */}
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="h-7 w-7 text-leaf" />}
            title={tl("Nothing here")}
            message={tl("No alerts match the current filters.")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-base text-xl shadow-neu-xs">
                  {cropEmoji(a.crop)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("neu-chip", PRIORITY_STYLE[a.priority])}>
                      {tl(a.priority)}
                    </span>
                    <span className="text-sm font-bold text-ink">{tl(a.type)}</span>
                    <span
                      className={cn(
                        "neu-chip",
                        a.state === "Resolved"
                          ? "bg-leaf/10 text-leaf"
                          : a.state === "In Review"
                          ? "bg-amber/10 text-amber"
                          : "bg-base text-ink-soft shadow-inset-sm"
                      )}
                    >
                      {tl(a.state)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{a.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/batch/${a.batchId}`} className="neu-btn !px-3 !py-2 text-xs">
                    {t("alerts.open")} <ChevronRight className="h-4 w-4" />
                  </Link>
                  {can("approve_actions") ? (
                    <div className="flex gap-1">
                      <button
                        title={tl("Mark In Review")}
                        onClick={() => {
                          setAlertState(a.id, "In Review");
                          toast("info", "In review", a.message);
                        }}
                        disabled={a.state === "In Review"}
                        className="neu-icon-btn h-10 w-10"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title={a.state === "Resolved" ? tl("Reopen") : tl("Resolve")}
                        onClick={() => {
                          const next = a.state === "Resolved" ? "Open" : "Resolved";
                          setAlertState(a.id, next);
                          toast(
                            next === "Resolved" ? "success" : "info",
                            next === "Resolved" ? "Alert resolved" : "Alert reopened"
                          );
                        }}
                        className={cn(
                          "neu-icon-btn h-10 w-10",
                          a.state === "Resolved" ? "text-ink-faint" : "text-leaf"
                        )}
                      >
                        {a.state === "Resolved" ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                      <BellRing className="h-3.5 w-3.5" /> {tl("review by manager")}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="p-4 text-center">
      <p className={cn("text-3xl font-black", tone)}>{fmt(value)}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
    </Card>
  );
}
