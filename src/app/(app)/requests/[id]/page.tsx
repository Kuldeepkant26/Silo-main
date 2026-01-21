import Link from "next/link";

import { Icons } from "~/components/icons";
import { RequestDetails } from "~/components/request-details";
import { Button } from "~/components/ui/button";
import { ROUTES } from "~/constants/routes";

interface RequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestPage({ params }: RequestPageProps) {
  const { id } = await params;

  return (
    <section className="flex flex-col space-y-6 px-8 py-4">
      <Button className="w-fit" variant="link" asChild>
        <Link href={ROUTES.REQUESTS}>
          <Icons.arrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </Button>

      <RequestDetails id={id} />
    </section>
  );
}
