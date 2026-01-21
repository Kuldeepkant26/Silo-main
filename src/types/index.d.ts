import type { createTranslator, Messages } from "next-intl";

import type { Icons } from "~/components/icons";

export type SidebarNavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  icon: keyof typeof Icons;
  tooltip?: string;
  tag?: string;
};

export type Item = {
  key: string;
  value?: string;
  label?: string;
};

export type SettingsItem = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Icons;
  href: string;
};

export type TFunction = ReturnType<typeof createTranslator<Messages>>;
