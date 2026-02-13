import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateTeam } from "~/components/create-team";
import { TeamsListSkeleton } from "~/components/skeletons";
import { TeamsList } from "~/components/teams-list";

export default function PeoplePage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between gap-3 border-b px-4 pt-7 sm:px-6 md:px-8 pb-2">
        <h2 className="text-lg sm:text-xl font-bold">{t("teams")}</h2>

        <CreateTeam />
      </header>

      <div className="mt-6 sm:mt-8 flex flex-col gap-y-4 px-4 sm:px-6 md:px-8">
        <Suspense fallback={<TeamsListSkeleton />}>
          <TeamsList />
        </Suspense>
      </div>
    </section>
  );
}
