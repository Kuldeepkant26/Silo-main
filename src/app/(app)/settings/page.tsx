import { useTranslations } from "next-intl";

import { ReportsDownload } from "~/components/reports-download";
import { SettingsList } from "~/components/settings-list";

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-4 sm:p-6 md:p-10">
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t("settings")}</h1>
        <ReportsDownload />
      </header>

      <div className="flex flex-col gap-6 max-w-[940px] w-full">
        <SettingsList />
      </div>
    </section>
  );
}
