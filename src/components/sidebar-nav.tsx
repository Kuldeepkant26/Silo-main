"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { SIDEBAR_NAV_ITEMS } from "~/config/dashboard";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";
import { api } from "~/trpc/react";

import { Icons } from "./icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { UserAccountNav } from "./user-account-nav";

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations();

  const { data: auth } = authClient.useSession();
  const { data: userRole } = api.member.getCurrentUserRole.useQuery(undefined, {
    enabled: !!auth?.session.activeOrganizationId,
  });

  // Filter sidebar items based on user role
  const filteredSidebarItems = SIDEBAR_NAV_ITEMS.filter((item) => {
    if (!item.visibleTo) return true;
    if (!userRole?.role) return false;
    return item.visibleTo.includes(userRole.role as "admin" | "owner" | "member" | "legal");
  });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-y-2">
      <div className="w-full flex flex-col gap-2 flex-1">
        {filteredSidebarItems.map((item, index) => {
          const Icon = Icons[item.icon] ?? Icons.chevronRight;
          const isDisabled = !auth?.session.activeOrganizationId || item.disabled;
          
          const titleKey = item.title;
          const itemHref = item.href;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "relative h-auto w-full items-center justify-start rounded-md py-3 px-4 transition-colors text-foreground/80 hover:bg-foreground/[0.06] text-lg font-medium bg-transparent border-none",
                    {
                      "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground": pathname.includes(itemHref) && !isDisabled,
                      "text-muted-foreground hover:text-muted-foreground hover:bg-transparent cursor-not-allowed opacity-60":
                        isDisabled,
                    },
                  )}
                  disabled={isDisabled}
                  variant="ghost"
                  asChild={!isDisabled}
                >
                  {isDisabled ? (
                    <span className="text-lg font-medium flex items-center">
                      <h4>{t(titleKey)}</h4>
                      {item.tag && (
                        <Badge
                          variant="outline"
                          className="border-foreground/50 text-foreground/80 absolute top-2 right-2 text-xs"
                        >
                          {t(item.tag)}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <Link className="text-lg font-medium" href={itemHref}>
                      <h4>{t(titleKey)}</h4>
                      {item.tag && (
                        <Badge
                          variant="outline"
                          className="border-foreground/50 text-foreground/80 absolute top-2 right-2 text-xs"
                        >
                          {t(item.tag)}
                        </Badge>
                      )}
                    </Link>
                  )}
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
        <div className="flex items-center gap-3 p-3 px-4 bg-muted dark:bg-accent rounded-xl">
          <UserAccountNav user={auth?.user} />
        </div>
      </div>
    </div>
  );
}
