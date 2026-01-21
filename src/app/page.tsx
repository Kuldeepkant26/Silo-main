import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";
import { ROUTES } from "~/constants/routes";

export default function Home() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      <header className="flex justify-end border-b px-8 py-4">
        <Button variant="outline" asChild>
          <Link href={ROUTES.LOGIN}>{t("login")}</Link>
        </Button>
      </header>
      <div className="flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <span className="text-primary">Landing Page</span>
        </h1>
      </div>
    </main>
  );
}
