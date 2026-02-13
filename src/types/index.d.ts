import type { createTranslator, Messages } from "next-intl";

import type { Icons } from "~/components/icons";

// View Transition API type augmentation
declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

export type SidebarNavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  icon: keyof typeof Icons;
  tooltip?: string;
  tag?: string;
  visibleTo?: ("admin" | "owner" | "member" | "legal")[];
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
