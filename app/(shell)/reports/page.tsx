"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Boxes, History, TriangleAlert, Trophy } from "lucide-react";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { KpiCard, KPI_ICONS } from "@/components/dashboard";
import { categoryTotals, totalStockKg, warehouseStats } from "@/lib/selectors";
import { computeFreshness } from "@/lib/freshness";
import { daysBetween } from "@/lib/time";
import { daysAgoKey } from "@/lib/reports";
import { warehouses } from "@/lib/demo-data";
import { fmt, fmtKg } from "@/lib/format";

const CAT_COLORS: Record<string, string> = {
  Vegetables: "#2F6B3B",
  Fruits: "#C68A20",
  "Grains / Cereals": "#4C8A58",
  "Cold Storage": "#3A6EA5",
  "Other Crops": "#8A968A",
};

const tooltipStyle = {
  borderRadius: 14,
  border: "none",
  background: "#F1EDE3",
  boxShadow: "5px 5px 12px rgba(163,153,128,0.5)",
  color: "#2E3A2F",
  fontSize: 12,
};

export default function ReportsPage() {
  const { visibleBatches, movements } = useStore();
  const { t } = useLanguage();

  const movementSeries = useMemo(() => daysAgoKey(movements), [movements]);

  const warehouseData = useMemo(
    () =>
      warehouses.map((w) => ({
        name: `W${w.code}`,
        stock: warehouseStats(w, visibleBatches.filter((b) => b.warehouseId === w.id)).stock,
      })),
    [visibleBatches]
  );

  const topStored = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of visibleBatches) m[b.crop] = (m[b.crop] ?? 0) + b.quantity;
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, z) => z.value - a.value)
      .slice(0, 5);
  }, [visibleBatches]);

  const topSold = useMemo(() => {
    const m: Record<string, number> = {};
    for (const mv of movements)
      if (mv.action === "SELL") m[mv.crop] = (m[mv.crop] ?? 0) + mv.quantity;
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, z) => z.value - a.value)
      .slice(0, 5);
  }, [movements]);

  const cats = categoryTotals(visibleBatches);
  const oldStock = visibleBatches.filter(
    (b) => daysBetween(b.storedAt) > computeFreshness(b).referenceDays * 0.6
  ).length;
  const critical = visibleBatches.filter((b) => {
    const s = computeFreshness(b).status;
    return s === "CRITICAL" || s === "INSPECT" || s === "URGENT";
  }).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("page.reports.title")}</h1>
        <p className="text-sm text-ink-soft">{t("page.reports.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={KPI_ICONS.stock} label="Current Stock" value={fmtKg(totalStockKg(visibleBatches))} tone="leaf" />
        <KpiCard icon={History} label="Old Stock" value={fmt(oldStock)} sub="review for FIFO" tone="amber" />
        <KpiCard icon={TriangleAlert} label="Critical Batches" value={fmt(critical)} tone="chili" />
        <KpiCard icon={Trophy} label="Most Stored" value={topStored[0]?.name ?? "—"} tone="sky" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Movement over time */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-ink">Stock Movement (last 7 days)</h2>
          <p className="text-sm text-ink-soft">Added vs Sold vs Removed</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementSeries} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gAdd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F6B3B" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2F6B3B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSell" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C68A20" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#C68A20" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C4452F" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#C4452F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d1bf" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5C6B5D" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B5D" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="add" name="Added" stroke="#2F6B3B" fill="url(#gAdd)" strokeWidth={2} />
                <Area type="monotone" dataKey="sell" name="Sold" stroke="#C68A20" fill="url(#gSell)" strokeWidth={2} />
                <Area type="monotone" dataKey="remove" name="Removed" stroke="#C4452F" fill="url(#gRem)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category donut */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Inventory by Category</h2>
          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cats} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
                  {cats.map((c) => (
                    <Cell key={c.name} fill={CAT_COLORS[c.name] ?? "#8A968A"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${fmt(v)} kg`} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1">
            {cats.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLORS[c.name] }} />
                <span className="text-ink-soft">{c.name}</span>
                <span className="ml-auto font-semibold text-ink">{c.percent}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Warehouse Comparison</h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseData} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d1bf" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5C6B5D" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B5D" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v: number) => `${fmt(v)} kg`} contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.4)" }} />
                <Bar dataKey="stock" name="Stock" radius={[8, 8, 0, 0]}>
                  {warehouseData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#2F6B3B" : "#4C8A58"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Most Stored Crop</h2>
          <RankList data={topStored} color="#2F6B3B" />
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-ink">Most Sold Crop</h2>
          <RankList data={topSold} color="#C68A20" metric="kg sold" />
        </Card>
      </div>
    </div>
  );
}

function RankList({
  data,
  color,
  metric = "kg",
}: {
  data: { name: string; value: number }[];
  color: string;
  metric?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length)
    return <p className="py-8 text-center text-sm text-ink-soft">No data yet.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {data.map((d) => (
        <li key={d.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{d.name}</span>
            <span className="text-ink-soft">
              {fmt(d.value)} {metric}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-base shadow-inset-sm">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
