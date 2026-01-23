"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { SIDEBAR_NAV_ITEMS } from "~/config/dashboard";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { UserAccountNav } from "./user-account-nav";

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations();

  const { data: auth } = authClient.useSession();

  return (
    <div className="flex h-full w-full flex-col justify-between gap-y-2">
      <div className="w-full flex flex-col gap-2 flex-1">
        {SIDEBAR_NAV_ITEMS.map((item, index) => {
          const Icon = Icons[item.icon] ?? Icons.chevronRight;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "relative h-auto w-full items-center justify-start rounded-md py-3 px-4 transition-colors text-[#333] hover:bg-black/[0.06] text-lg font-medium bg-transparent border-none",
                    {
                      "bg-[#1a1a1a] text-white hover:bg-[#1a1a1a] hover:text-white": pathname.includes(item.href),
                      "text-[#999] hover:text-[#999] cursor-not-allowed opacity-60":
                        !auth?.session.activeOrganizationId || item.disabled,
                    },
                  )}
                  disabled={
                    !auth?.session.activeOrganizationId || item.disabled
                  }
                  variant="ghost"
                  asChild={!(!auth?.session.activeOrganizationId || item.disabled)}
                >
                  <Link className="text-lg font-medium" href={item.href}>
                    <h4>{t(item.title)}</h4>

                    {item.tag && (
                      <Badge
                        variant="outline"
                        className="border-[#333] text-[#333] absolute top-2 right-2 text-xs"
                      >
                        {t(item.tag)}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              {item.tooltip && (
                <TooltipContent side="right">
                  <p>{t(item.tooltip)}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-auto">
        <div className="flex items-center gap-3 p-3 px-4 bg-[#b8b8b8] rounded-xl">
          <UserAccountNav user={auth?.user} />
        </div>
      </div>
    </div>
  );
}
