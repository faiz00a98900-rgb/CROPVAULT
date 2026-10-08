"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Warehouse as WhIcon, ChevronDown, Menu } from "lucide-react";
import { useStore } from "@/providers/store";
import { warehouses } from "@/lib/demo-data";
import { LiveClock } from "./Clock";
import { cn } from "@/lib/cn";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { user, alerts, activeWarehouseId, setActiveWarehouse, accessibleWarehouseIds } =
    useStore();
  const [query, setQuery] = useState("");
  const [whOpen, setWhOpen] = useState(false);

  const openAlerts = alerts.filter((a) => a.state !== "Resolved").length;
  const activeWh = warehouses.find((w) => w.id === activeWarehouseId);
  const options = warehouses.filter((w) => accessibleWarehouseIds.includes(w.id));

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/inventory${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 md:px-6">
        <button className="neu-icon-btn lg:hidden" onClick={onMenu} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:block">
          <p className="text-sm font-black tracking-tight text-ink">CROPVAULT</p>
        </div>

        {/* Search */}
        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-md flex-1 md:ml-4 md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory, crop or batch…"
            className="neu-input !py-2.5 pl-10"
            aria-label="Search inventory"
          />
        </form>

        {/* Warehouse selector */}
        <div className="relative ml-auto md:ml-0">
          <button
            onClick={() => setWhOpen((o) => !o)}
            className="neu-btn !px-3 !py-2.5 text-sm"
            aria-haspopup="menu"
            aria-expanded={whOpen}
          >
            <WhIcon className="h-4 w-4 text-leaf-dark" />
            <span className="hidden max-w-[110px] truncate sm:inline">
              {activeWh?.name ?? "Warehouse"}
            </span>
            <ChevronDown className="h-4 w-4 text-ink-faint" />
          </button>
          {whOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setWhOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl2 bg-base p-2 shadow-neu">
                <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Current warehouse
                </p>
                {options.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWarehouse(w.id);
                      setWhOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:shadow-inset-sm",
                      w.id === activeWarehouseId ? "text-leaf-dark" : "text-ink"
                    )}
                  >
                    <span>{w.name}</span>
                    <span className="text-xs text-ink-faint">{w.location.split(",")[0]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Link href="/alerts" className="neu-icon-btn" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {openAlerts > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-chili px-1 text-[10px] font-bold text-white shadow-neu-xs">
              {openAlerts}
            </span>
          )}
        </Link>

        {/* User */}
        <Link href="/profile" className="flex items-center gap-2 pl-1" aria-label="Profile">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-base text-sm font-bold text-leaf-dark shadow-neu-sm">
            {user?.avatarInitials ?? "—"}
          </span>
          <span className="hidden leading-tight xl:block">
            <span className="block text-sm font-semibold text-ink">{user?.name}</span>
            <span className="block text-[11px] uppercase tracking-wide text-ink-faint">
              {user?.role}
            </span>
          </span>
        </Link>

        {/* Clock */}
        <div className="hidden pl-2 lg:block">
          <LiveClock />
        </div>
      </div>
    </header>
  );
}
