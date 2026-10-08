"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Leaf } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { Logo } from "./ui";
import { useStore } from "@/providers/store";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, can, logout } = useStore();
  const { t } = useLanguage();

  const items = NAV_ITEMS.filter(
    (i) => !i.perm || can(i.perm as never)
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div className={cn("flex items-center gap-3 px-2 py-3", collapsed && "justify-center")}>
        <Logo />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-base font-black tracking-tight text-ink">CROPVAULT</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
              {t("brand.cropWarehouse")}
            </p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? t(item.labelKey) : undefined}
              className={cn("neu-nav-item", collapsed && "justify-center px-0")}
              data-active={active}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-leaf-dark")} />
              {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-2 mb-2 rounded-xl2 bg-base p-3 shadow-inset-sm">
          <div className="flex items-center gap-2 text-leaf-dark">
            <Leaf className="h-4 w-4" />
            <p className="text-xs font-bold">{t("sidebar.secureSession")}</p>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-ink-soft">
            {t("sidebar.roleEnforced", { name: user?.name ?? "" })}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          logout();
        }}
        className={cn(
          "neu-nav-item mx-1 mb-1 w-full text-chili hover:text-chili",
          collapsed && "justify-center px-0"
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{t("sidebar.logOut")}</span>}
      </button>
    </div>
  );
}
