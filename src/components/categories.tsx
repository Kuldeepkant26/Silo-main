import { useTranslations } from "next-intl";

export function Categories() {
  const t = useTranslations();

  return (
    <header className="-mx-2 flex justify-between px-8 pt-7 pb-2 md:-mx-8">
      <h2 className="text-xl font-bold">{t("categories")}</h2>

      {/* <CreateCategory /> */}
    </header>
  );
}
