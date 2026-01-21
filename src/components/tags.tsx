import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateTag } from "./create-tag";
import { TagsListSkeleton } from "./skeletons/tags-list.skeleton";
import { TagsList } from "./tags-list";

export function Tags() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between px-8 pt-7 pb-2 md:-mx-8">
        <h2 className="text-xl font-bold">{t("categories")}</h2>

        <CreateTag />
      </header>

      <div className="mt-2 flex flex-col gap-y-4">
        <Suspense fallback={<TagsListSkeleton />}>
          <TagsList />
        </Suspense>
      </div>
    </section>
  );
}
