"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_ITEMS } from "./nav";
import { useStore } from "@/providers/store";
import { cn } from "@/lib/cn";

export function MobileNav() {
  const pathname = usePathname();
  const { can } = useStore();
  const items = MOBILE_ITEMS.filter((i) => !i.perm || can(i.perm as never));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/40 bg-base/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition",
                  active ? "text-leaf-dark" : "text-ink-faint"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition-all",
                    active ? "bg-base shadow-inset-sm" : "shadow-none"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
