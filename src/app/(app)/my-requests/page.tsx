import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { MyRequestsList } from "~/components/my-requests-list";
import { RequestsListSkeleton } from "~/components/skeletons";

export default function MyRequestsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col h-screen overflow-hidden p-4 md:p-10 md:pb-4">
      <header className="mb-6 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t("my_requests")}</h1>
      </header>

      <Suspense fallback={<RequestsListSkeleton />}>
        <MyRequestsList />
      </Suspense>
    </section>
  );
}
