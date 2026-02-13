import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateRequest } from "~/components/create-request";
import { RequestsList } from "~/components/requests-list";
import { RequestsListSkeleton } from "~/components/skeletons";

export default function RequestsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-4 sm:p-6 md:p-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t("requests")}</h1>

        <CreateRequest />
      </header>

      <div className="w-full">
        <Suspense fallback={<RequestsListSkeleton />}>
          <RequestsList />
        </Suspense>
      </div>
    </section>
  );
}
