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
    <div className="flex h-full w-full flex-col justify-between gap-y-4">
      <div className="w-full">
        {SIDEBAR_NAV_ITEMS.map((item, index) => {
          const Icon = Icons[item.icon] ?? Icons.chevronRight;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "hover:text-primary relative h-auto w-full items-center justify-start rounded-none border-b py-4 transition-none hover:bg-transparent",
                    {
                      "text-muted-foreground hover:text-muted-foreground cursor-not-allowed":
                        !auth?.session.activeOrganizationId || item.disabled,
                    },
                  )}
                  disabled={
                    !auth?.session.activeOrganizationId || item.disabled
                  }
                  variant="ghost"
                  asChild
                >
                  <Link className="!pl-6 text-sm font-medium" href={item.href}>
                    <Icon
                      className={cn("h-4 w-4", {
                        "text-primary font-bold": pathname.includes(item.href),
                      })}
                    />

                    <h4
                      className={cn({
                        "text-primary font-bold": pathname.includes(item.href),
                      })}
                    >
                      {t(item.title)}
                    </h4>

                    {item.tag && (
                      <Badge
                        variant="outline"
                        className="border-text-muted-foreground text-muted-foreground absolute top-2 right-2"
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
      <div className="flex items-center justify-start border-t px-4 py-8">
        <UserAccountNav user={auth?.user} />
      </div>
    </div>
  );
}
