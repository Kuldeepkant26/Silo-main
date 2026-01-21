import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateRequest } from "~/components/create-request";
import { RequestsList } from "~/components/requests-list";
import { RequestsListSkeleton } from "~/components/skeletons";

export default function RequestsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between border-b px-8 pt-7 pb-2">
        <h2 className="text-xl font-bold">{t("requests")}</h2>

        <CreateRequest />
      </header>

      <div className="mt-8 grid grid-cols-1 gap-2 px-8 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<RequestsListSkeleton />}>
          <RequestsList />
        </Suspense>
      </div>
    </section>
  );
}
