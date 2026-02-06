import type { SidebarNavItem } from "~/types";

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "requests",
    href: "/requests",
    icon: "tickets",
  },
  {
    title: "review",
    href: "/review",
    icon: "checkCircle",
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
    title: "silo_agent",
    href: "/agent",
    icon: "ai",
    disabled: true,
  },
];
