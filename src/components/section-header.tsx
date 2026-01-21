import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface SectionHeaderProps {
  component?: ReactNode;
}

export function SectionHeader({ component }: SectionHeaderProps) {
  const t = useTranslations();

  return (
    <header className="flex justify-between border-b px-8 pt-7 pb-2">
      <h2 className="text-xl font-bold">{t("people")}</h2>

      {component}
    </header>
  );
}
