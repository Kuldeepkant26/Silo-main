import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { MyRequestsList } from "~/components/my-requests-list";
import { RequestsListSkeleton } from "~/components/skeletons";

export default function MyRequestsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-4 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t("my_requests")}</h1>
      </header>

      <Suspense fallback={<RequestsListSkeleton />}>
        <MyRequestsList />
      </Suspense>
    </section>
  );
}
