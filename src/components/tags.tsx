import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateTag } from "./create-tag";
import { TagsListSkeleton } from "./skeletons/tags-list.skeleton";
import { TagsList } from "./tags-list";

export function Tags() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between items-center mb-6 px-8 md:-mx-8">
        <h2 className="text-2xl font-bold text-[#171717]">{t("categories")}</h2>

        <CreateTag />
      </header>

      <div className="flex flex-col gap-y-4">
        <Suspense fallback={<TagsListSkeleton />}>
          <TagsList />
        </Suspense>
      </div>
    </section>
  );
}
