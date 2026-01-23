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
          <h2 className="text-2xl font-bold text-[#171717]">{t("current_plan")}</h2>

          <Card className="bg-gradient-to-br from-white to-[#fafafa] border-[#e2e2e2] shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
            <CardHeader>
              <Badge variant="outline" className="rounded-full px-3 py-2 border-[#e2e2e2]">
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
              <h3 className="text-xl font-bold text-[#171717] italic">{t("free_plan")}</h3>

              <p className="text-[#5b5b5b] text-[15px] leading-[1.5]">
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
                className="hover:bg-transparent border-[#e2e2e2]"
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
