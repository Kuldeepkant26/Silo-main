import { useTranslations } from "next-intl";

import { SettingsList } from "~/components/settings-list";

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-10">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">{t("settings")}</h1>
      </header>

      <div className="flex flex-col gap-6 max-w-[940px] w-full">
        <SettingsList />
      </div>
    </section>
  );
}
