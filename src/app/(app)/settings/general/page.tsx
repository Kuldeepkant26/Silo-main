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
    <section className="flex flex-col">
      <header className="flex items-end justify-between border-b px-8 pt-7 pb-2">
        <div className="flex flex-col items-start gap-y-4">
          <BackButton
            className="!px-0"
            route={ROUTES.SETTINGS}
            label="back_to_settings"
          />

          <h2 className="text-xl font-bold">{t("general")}</h2>
        </div>

        <Button disabled={true}>
          <Icons.upgrade className="h-6 w-6" />
          {t("upgrade_to_pro")}
        </Button>
      </header>

      <div className="mt-8 flex flex-col gap-y-4 px-2 md:px-8">
        <BillingPlan />

        <OrganizationDetails />
      </div>
    </section>
  );
}
