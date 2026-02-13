import { useTranslations } from "next-intl";

import { UserAccountTabs } from "~/components/user-account-tabs";

export default function AccountPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between border-b px-4 pt-7 sm:px-6 md:px-8 pb-2">
        <h2 className="text-lg sm:text-xl font-bold">{t("account")}</h2>
      </header>

      <div className="mt-6 sm:mt-8 flex flex-col px-2 sm:px-4 md:px-8">
        <UserAccountTabs />
      </div>
    </section>
  );
}
