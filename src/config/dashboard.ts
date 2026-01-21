import type { SidebarNavItem } from "~/types";

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "requests",
    href: "/requests",
    icon: "tickets",
  },
  {
    title: "people",
    href: "/people",
    icon: "user",
  },
  {
    title: "teams",
    href: "/teams",
    icon: "teams",
  },
  {
    title: "settings",
    href: "/settings",
    icon: "settings",
  },
  {
    title: "silo_ai",
    href: "#",
    icon: "ai",
    disabled: true,
    tooltip: "coming_soon",
    tag: "soon",
  },
];
