"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";

import { authClient } from "~/server/auth/client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

export function BillingPlan() {
  // TODO: When implemented, fetch user's current plan
  const { data: organization } = authClient.useActiveOrganization();

  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <div className="col-span-1">
        <div className="flex flex-col gap-y-4">
          <h1 className="text-primary font-bold">{t("current_plan")}</h1>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="rounded-full px-3 py-2">
                Since{" "}
                {format(
                  organization?.createdAt
                    ? new Date(organization?.createdAt)
                    : new Date(),
                  "PPP",
                )}
              </Badge>
            </CardHeader>

            <CardContent className="flex flex-col gap-y-2">
              <h1 className="text-xl italic">{t("free_plan")}</h1>

              <p className="text-sm">
                You are currently on the{" "}
                <span className="font-bold italic">Silo Free Plan</span>. There
                are no recurring charges, and you have no ongoing billing
                obligations. We invite you to continue enjoying the core
                features of Silo. <br />
              </p>
            </CardContent>

            <CardFooter className="mt-8 justify-end">
              <Button
                disabled
                variant="outline"
                className="hover:bg-transparent"
              >
                {t("change_plan")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
