"use client";

import { useTranslations } from "next-intl";

import { Icons } from "~/components/icons";
import { SectionHeader } from "~/components/section-header";

export default function GetStartedPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <SectionHeader title={t("get_started")} />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Icons.rocket className="text-muted-foreground h-16 w-16" />
          <h2 className="text-2xl font-semibold">{t("coming_soon")}</h2>
          <p className="text-muted-foreground max-w-md">
            {t("coming_soon_description")}
          </p>
        </div>
      </div>
    </div>
  );
}
