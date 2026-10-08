"use client";

import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  Warehouse,
  Tags,
  ArrowLeftRight,
  BellRing,
  BarChart3,
  ShieldCheck,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/providers/store";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  perm?: Permission;
  mobile?: boolean; // show in bottom nav
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/inventory", label: "Inventory", icon: Boxes, mobile: true },
  { href: "/add-inventory", label: "Add Inventory", icon: PackagePlus, perm: "add_inventory", mobile: true },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/stock-movement", label: "Stock Movement", icon: ArrowLeftRight, perm: "record_movement", mobile: true },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3, perm: "view_reports" },
  { href: "/security", label: "Security Center", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "User Profile", icon: UserRound },
];

export const MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.mobile).slice(0, 5);
