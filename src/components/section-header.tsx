import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface SectionHeaderProps {
  title?: string;
  component?: ReactNode;
}

export function SectionHeader({ title, component }: SectionHeaderProps) {
  const t = useTranslations();

  return (
    <header className="flex flex-col sm:flex-row justify-between gap-3 border-b px-4 pt-7 sm:px-6 md:px-8 pb-2">
      <h2 className="text-lg sm:text-xl font-bold">{title ?? t("people")}</h2>

      {component}
    </header>
  );
}





