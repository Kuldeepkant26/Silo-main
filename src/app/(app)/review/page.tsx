import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { ReviewList } from "~/components/review-list";
import { ReviewListSkeleton } from "~/components/skeletons/review-list.skeleton";

export default function ReviewPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-4 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">{t("review")}</h1>
      </header>

      <Suspense fallback={<ReviewListSkeleton />}>
        <ReviewList />
      </Suspense>
    </section>
  );
}
