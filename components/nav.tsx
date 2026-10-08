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
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/providers/store";

export interface NavItem {
  href: string;
  label: string;
  labelKey: string;
  icon: LucideIcon;
  perm?: Permission;
  mobile?: boolean; // show in bottom nav
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/inventory", label: "Inventory", labelKey: "nav.inventory", icon: Boxes, mobile: true },
  { href: "/add-inventory", label: "Add Inventory", labelKey: "nav.addInventory", icon: PackagePlus, perm: "add_inventory", mobile: true },
  { href: "/warehouses", label: "Warehouses", labelKey: "nav.warehouses", icon: Warehouse },
  { href: "/categories", label: "Categories", labelKey: "nav.categories", icon: Tags },
  { href: "/stock-movement", label: "Stock Movement", labelKey: "nav.stockMovement", icon: ArrowLeftRight, perm: "record_movement", mobile: true },
  { href: "/alerts", label: "Alerts", labelKey: "nav.alerts", icon: BellRing },
  { href: "/reports", label: "Reports & Analytics", labelKey: "nav.reports", icon: BarChart3, perm: "view_reports" },
  { href: "/security", label: "Security Center", labelKey: "nav.security", icon: ShieldCheck },
  { href: "/settings", label: "Settings", labelKey: "nav.settings", icon: Settings },
  { href: "/profile", label: "User Profile", labelKey: "nav.profile", icon: UserRound },
  { href: "/tutorial", label: "Tutorial", labelKey: "nav.tutorial", icon: GraduationCap },
];

export const MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.mobile).slice(0, 5);
