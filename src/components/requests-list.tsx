"use client";

import { Fragment } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

import { ROUTES } from "~/constants/routes";
import { api } from "~/trpc/react";

import { Icons } from "./icons";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function RequestsList() {
  const t = useTranslations();

  const [requests] = api.request.getByCompany.useSuspenseQuery();

  return !requests.length ? (
    <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
      {t("request_list_not_found")}
    </p>
  ) : (
    requests.map((request) => (
      <Card
        key={request.id}
        className="col-span-1 min-h-28 w-full cursor-pointer"
      >
        <Link href={`${ROUTES.REQUESTS}/${request.id}`}>
          <CardHeader>
            <CardTitle>{request.summary}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {request.description}
          </CardContent>
          <CardFooter className="text-muted-foreground mt-2 -mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-x-1">
              {request.attachments && request.attachments?.length > 0 ? (
                <Fragment>
                  <Icons.files className="text-primary h-4 w-4" />
                  <span>
                    {request.attachments.length} {t("attachment_s")}
                  </span>
                </Fragment>
              ) : (
                ""
              )}
            </div>

            <div className="flex items-center gap-x-1">
              <Icons.calendarRange className="text-primary h-4 w-4" />
              {request.startDate && (
                <span>{format(request.startDate, "MMM dd")}</span>
              )}
              {request.startDate && request.dueDate && <span> - </span>}
              {request.dueDate && (
                <span>{format(request.dueDate, "MMM dd")}</span>
              )}
            </div>
          </CardFooter>
        </Link>
      </Card>
    ))
  );
}
