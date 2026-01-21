"use client";

import { useTranslations } from "next-intl";

import { BackButton } from "~/components/back-button";
import { Icons } from "~/components/icons";
import { Tags } from "~/components/tags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ROUTES } from "~/constants/routes";

export default function SettingsRequestsAndReviewsPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col">
      <header className="flex items-end justify-between border-b px-8 pt-7 pb-2">
        <div className="flex flex-col items-start gap-y-4">
          <BackButton
            className="!px-0"
            route={ROUTES.SETTINGS}
            label="back_to_settings"
          />

          <h2 className="text-xl font-bold">{t("requests_and_reviews")}</h2>
        </div>
      </header>

      <div className="mt-2 flex flex-col gap-y-4 px-2 md:px-8">
        <Tabs className="gap-y-4" defaultValue="categories">
          <TabsList>
            <TabsTrigger className="w-full" value="categories">
              <Icons.categories className="h-4 w-4" />
              {t("categories")}
            </TabsTrigger>

            <Tooltip>
              <TabsTrigger
                disabled
                className="!pointer-events-auto w-full cursor-not-allowed"
                value="automatic-replies"
              >
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-x-2">
                    <Icons.automaticReplies className="h-4 w-4" />
                    {t("automatic_replies")}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t("coming_soon")}</p>
                </TooltipContent>
              </TabsTrigger>
            </Tooltip>
          </TabsList>

          <TabsContent className="flex flex-col space-y-4" value="categories">
            <Tags />
          </TabsContent>

          {/* <TabsContent
            className="flex flex-col space-y-4"
            value="automatic-replies"
          >
            <AutomaticReplies />
          </TabsContent> */}
        </Tabs>
      </div>
    </section>
  );
}
