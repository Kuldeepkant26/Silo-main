import { Suspense } from "react";

import { CreateMember } from "~/components/create-member";
import { InvitationsList } from "~/components/invitations-list";
import { PeopleList } from "~/components/people-list";
import { SectionHeader } from "~/components/section-header";
import { PeopleListSkeleton } from "~/components/skeletons";
import { Separator } from "~/components/ui/separator";

export default async function PeoplePage() {
  return (
    <section className="flex flex-col">
      <SectionHeader component={<CreateMember />} />

      <div className="mt-6 sm:mt-8 flex flex-col gap-y-4 px-2 sm:px-4 md:px-8">
        <Suspense fallback={<PeopleListSkeleton />}>
          <PeopleList />
        </Suspense>

        <Separator className="my-8" />

        <Suspense fallback={<PeopleListSkeleton />}>
          <InvitationsList />
        </Suspense>
      </div>
    </section>
  );
}
