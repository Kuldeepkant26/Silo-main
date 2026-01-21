import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { CreateTeam } from "~/components/create-team";
import { TeamsListSkeleton } from "~/components/skeletons";
import { TeamsList } from "~/components/teams-list";

export default function PeoplePage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex justify-between border-b px-8 pt-7 pb-2">
        <h2 className="text-xl font-bold">{t("teams")}</h2>

        <CreateTeam />
      </header>

      <div className="mt-8 flex flex-col gap-y-4 px-8">
        <Suspense fallback={<TeamsListSkeleton />}>
          <TeamsList />
        </Suspense>
      </div>
    </section>
  );
}
