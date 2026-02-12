import type { SidebarNavItem } from "~/types";

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "get_started",
    href: "/get-started",
    icon: "rocket",
    visibleTo: ["member"],
    disabled: true,
    tag: "soon",
  },
  {
    title: "requests",
    href: "/requests",
    icon: "tickets",
    visibleTo: ["admin", "owner", "legal"],
  },
  {
    title: "my_requests",
    href: "/my-requests",
    icon: "tickets",
    visibleTo: ["member"],
  },
  {
    title: "review",
    href: "/review",
    icon: "checkCircle",
    visibleTo: ["admin", "owner", "legal"],
  },
  {
    title: "chats",
    href: "/chats",
    icon: "messageSquare",
    visibleTo: ["member"],
    disabled: true,
    tag: "soon",
  },
  {
    title: "people",
    href: "/people",
    icon: "user",
    visibleTo: ["admin", "owner", "legal"],
  },
  {
    title: "teams",
    href: "/teams",
    icon: "teams",
    visibleTo: ["admin", "owner", "legal"],
  },
  {
    title: "settings",
    href: "/settings",
    icon: "settings",
    visibleTo: ["admin", "owner", "legal"],
  },
  {
    title: "silo_ai",
    href: "/agent",
    icon: "ai",
  },
];
