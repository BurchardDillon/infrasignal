import {
  LayoutDashboard,
  Building2,
  Users,
  Newspaper,
  ListFilter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/accounts", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "News Intelligence", href: "/intelligence", icon: Newspaper },
  { label: "Prospecting Queue", href: "/prospecting", icon: ListFilter },
];
