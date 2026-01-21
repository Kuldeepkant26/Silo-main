import { useTranslations } from "next-intl";

import { UserAccountTabs } from "~/components/user-account-tabs";

export default function AccountPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between border-b px-8 pt-7 pb-2">
        <h2 className="text-xl font-bold">{t("account")}</h2>
      </header>

      <div className="mt-8 flex flex-col px-2 md:px-8">
        <UserAccountTabs />
      </div>
    </section>
  );
}
