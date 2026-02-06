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
        <div className="flex flex-col gap-y-6">
          <h2 className="text-2xl font-bold text-foreground">{t("current_plan")}</h2>

          <Card className="bg-gradient-to-br from-card to-muted/30 border-border shadow-sm">
            <CardHeader>
              <Badge variant="outline" className="rounded-full px-3 py-2 border-border">
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
              <h3 className="text-xl font-bold text-foreground italic">{t("free_plan")}</h3>

              <p className="text-muted-foreground text-[15px] leading-[1.5]">
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
                className="hover:bg-transparent border-border"
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
