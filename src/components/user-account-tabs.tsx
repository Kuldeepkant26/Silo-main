"use client";

import { Fragment, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  USER_ACCOUNT_TAB_PREFERENCES,
  USER_ACCOUNT_TAB_PROFILE,
  USER_ACCOUNT_TABS,
} from "~/config/account";

import { Icons } from "./icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { UserAccountPreferences } from "./user-account-preferences";
import { UserAccountProfile } from "./user-account-profile";

export function UserAccountTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = useSearchParams().get("t");
  const t = useTranslations();

  const isTabParamInvalid =
    tabParam !== USER_ACCOUNT_TAB_PROFILE &&
    tabParam !== USER_ACCOUNT_TAB_PREFERENCES;

  const [activeTab, setActiveTab] = useState<string>(
    tabParam && !isTabParamInvalid ? tabParam : USER_ACCOUNT_TAB_PROFILE,
  );

  useEffect(() => {
    router.replace(`${pathname}?t=${activeTab}`);
  }, [activeTab, pathname, router, tabParam]);

  return (
    <Fragment>
      <div className="mb-8">
        <p className="text-muted-foreground">{t("account_description")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          {USER_ACCOUNT_TABS.map((tab) => {
            const Icon = Icons[tab.icon as keyof typeof Icons];

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {t(tab.label)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={USER_ACCOUNT_TAB_PROFILE} className="space-y-6">
          <UserAccountProfile />
        </TabsContent>

        <TabsContent value={USER_ACCOUNT_TAB_PREFERENCES} className="space-y-6">
          <UserAccountPreferences />
        </TabsContent>
      </Tabs>
    </Fragment>
  );
}
