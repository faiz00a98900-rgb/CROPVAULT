"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore } from "@/providers/store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/cn";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useStore();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // Auth guard
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  // Close drawer on navigation
  useEffect(() => setDrawer(false), [pathname]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-deep border-t-leaf" />
      </div>
    );
  }

  const handleMenu = () => {
    if (isMobile) setDrawer(true);
    else setCollapsed((c) => !c);
  };

  return (
    <div className="min-h-screen">
      {/* Persistent sidebar (tablet + desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/40 bg-base/60 backdrop-blur-md transition-[width] duration-200 md:block",
          collapsed ? "w-[84px]" : "w-[264px]"
        )}
      >
        <Sidebar collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="neu-icon-btn absolute -right-3 top-8 hidden h-7 w-7 md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={() => setDrawer(false)}
          />
          <div className="drawer-in absolute inset-y-0 left-0 w-[264px] bg-base shadow-neu">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "md:pl-[84px]" : "md:pl-[264px]")}>
        <TopBar onMenu={handleMenu} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
