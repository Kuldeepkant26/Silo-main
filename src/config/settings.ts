import type { Item, SettingsItem } from "~/types";
import { ROUTES } from "~/constants/routes";

export const SETTINGS_ITEMS: SettingsItem[] = [
  {
    key: "OL5VHKyIuC",
    title: "general",
    description: "general_settings_description",
    icon: "organization",
    href: ROUTES.SETTINGS_GENERAL,
  },
  {
    key: "1VI6t8LMQn",
    title: "requests_and_reviews",
    description: "requests_and_reviews_description",
    icon: "request",
    href: ROUTES.SETTINGS_REQUESTS_AND_REVIEWS,
  },
];

export const RAR_SETTINGS_ITEMS: SettingsItem[] = [
  {
    key: "prb9myXc4a",
    title: "tags",
    description: "tags_description",
    icon: "tag",
    href: ROUTES.SETTINGS_REQUESTS_AND_REVIEWS_TAGS,
  },
  {
    key: "HVKBWAMtkd",
    title: "categories",
    description: "categories_description",
    icon: "categories",
    href: ROUTES.SETTINGS_REQUESTS_AND_REVIEWS_TAGS,
  },
];

export const SEARCH_PARAM_TAG_ID = "tagId";

export const TAG_STATUS: Item[] = [
  {
    key: "active",
    value: "active",
  },
  {
    key: "inactive",
    value: "inactive",
  },
];
