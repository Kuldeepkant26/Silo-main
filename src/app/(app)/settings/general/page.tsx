import { useTranslations } from "next-intl";

import { BackButton } from "~/components/back-button";
import { BillingPlan } from "~/components/billing-plan";
import { Icons } from "~/components/icons";
import { OrganizationDetails } from "~/components/organization-details";
import { Button } from "~/components/ui/button";
import { ROUTES } from "~/constants/routes";

export default function SettingsGeneralPage() {
  const t = useTranslations();

  return (
    <section className="flex flex-col p-4 sm:p-6 md:p-10">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col items-start gap-y-3 sm:gap-y-4">
          <BackButton
            className="!px-0 text-foreground hover:text-foreground/80"
            route={ROUTES.SETTINGS}
            label="back_to_settings"
          />

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t("general")}</h1>
        </div>

        <Button disabled={true} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
          <Icons.upgrade className="h-6 w-6" />
          {t("upgrade_to_pro")}
        </Button>
      </header>

      <div className="flex flex-col gap-6 max-w-[940px] w-full">
        <BillingPlan />

        <OrganizationDetails />
      </div>
    </section>
  );
}
