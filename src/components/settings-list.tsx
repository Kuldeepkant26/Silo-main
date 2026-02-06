import Link from "next/link";
import { useTranslations } from "next-intl";

import { SETTINGS_ITEMS } from "~/config/settings";

import { Icons } from "./icons";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

export function SettingsList() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] tracking-[0.08em] uppercase text-muted-foreground font-bold">
          Settings overview
        </p>
        <h2 className="text-[28px] font-bold text-foreground">
          Manage how SILO runs for your team
        </h2>
        <p className="text-muted-foreground text-[15px] max-w-[720px] leading-[1.5]">
          Quick access to the most common legal operations controls. Each tile opens the detailed controls for that area.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="flex flex-col gap-[18px]">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = Icons[item.icon];

          return (
            <Link href={item.href} key={item.key}>
              <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md cursor-pointer outline-none focus:-translate-y-0.5 focus:border-ring focus:shadow-md">
                {/* Card Text */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold text-foreground">
                    {t(item.title)}
                  </h3>
                  <p className="text-muted-foreground text-[15px] leading-[1.5]">
                    {t(item.description)}
                  </p>
                </div>

                {/* Card Action */}
                <div className="inline-flex items-center gap-2.5 text-foreground">
                  <span className="bg-muted rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.04em] text-muted-foreground">
                    Open
                  </span>
                  <Icons.chevronRight className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
