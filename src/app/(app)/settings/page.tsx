import { useTranslations } from "next-intl";

import { SettingsList } from "~/components/settings-list";

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between border-b px-8 pt-7 pb-2">
        <h2 className="text-xl font-bold">{t("settings")}</h2>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 px-2 md:grid-cols-2 md:px-8">
        <SettingsList />
      </div>
    </section>
  );
}
