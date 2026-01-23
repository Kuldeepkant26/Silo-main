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
        <p className="text-[13px] tracking-[0.08em] uppercase text-[#7a7a7a] font-bold">
          Settings overview
        </p>
        <h2 className="text-[28px] font-bold text-[#111]">
          Manage how SILO runs for your team
        </h2>
        <p className="text-[#595959] text-[15px] max-w-[720px] leading-[1.5]">
          Quick access to the most common legal operations controls. Each tile opens the detailed controls for that area.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="flex flex-col gap-[18px]">
        {SETTINGS_ITEMS.map((item) => {
          const Icon = Icons[item.icon];

          return (
            <Link href={item.href} key={item.key}>
              <div className="bg-gradient-to-br from-white to-[#fafafa] border border-[#e2e2e2] rounded-2xl p-5 flex items-center gap-4 shadow-[0_10px_30px_rgba(17,17,17,0.04)] transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-[#cfcfcf] hover:shadow-[0_14px_38px_rgba(17,17,17,0.06)] cursor-pointer outline-none focus:-translate-y-0.5 focus:border-[#cfcfcf] focus:shadow-[0_14px_38px_rgba(17,17,17,0.06)]">
                {/* Card Text */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold text-[#171717]">
                    {t(item.title)}
                  </h3>
                  <p className="text-[#5b5b5b] text-[15px] leading-[1.5]">
                    {t(item.description)}
                  </p>
                </div>

                {/* Card Action */}
                <div className="inline-flex items-center gap-2.5 text-[#1a1a1a]">
                  <span className="bg-[#f0f0f0] rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.04em] text-[#3a3a3a]">
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
