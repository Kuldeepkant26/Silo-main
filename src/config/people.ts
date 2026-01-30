import type { Item } from "~/types";

export const ROLES: Item[] = [
  {
    key: "member",
    label: "member",
    value: "member",
  },
  {
    key: "legal",
    label: "legal",
    value: "legal",
  },
  {
    key: "admin",
    label: "admin",
    value: "admin",
  },
  {
    key: "owner",
    label: "owner",
    value: "owner",
  },
];

export const SEARCH_PARAM_MEMBER_ID = "memberId";

export const PEOPLE_LIST_PAGE_SIZE = 5;
