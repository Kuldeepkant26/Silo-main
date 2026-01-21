import Link from "next/link";
import { useTranslations } from "next-intl";

import { SETTINGS_ITEMS } from "~/config/settings";

import { Icons } from "./icons";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

export function SettingsList() {
  const t = useTranslations();

  return SETTINGS_ITEMS.map((item) => {
    const Icon = Icons[item.icon];

    return (
      <Link href={item.href} key={item.key}>
        <Card className="col-span-1 flex h-full w-full justify-center">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-4">
                <Icon className="h-6 w-6" />

                <div className="flex flex-1 flex-col gap-y-2">
                  <CardTitle>{t(item.title)}</CardTitle>
                  <CardDescription>{t(item.description)}</CardDescription>
                </div>
              </div>

              <Icons.chevronRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  });
}
