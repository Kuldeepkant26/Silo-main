import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateRequest } from "~/components/create-request";
import { RequestsList } from "~/components/requests-list";
import { RequestsListSkeleton } from "~/components/skeletons";

export default function RequestsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-10">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#1a1a1a]">{t("requests")}</h1>

        <CreateRequest />
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<RequestsListSkeleton />}>
          <RequestsList />
        </Suspense>
      </div>
    </section>
  );
}
