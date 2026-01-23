"use client";

import type { User } from "better-auth";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserAvatar } from "~/components/user-avatar";
import { ROUTES } from "~/constants/routes";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
import { Spinner } from "./spinner";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: Pick<User, "name" | "image" | "email">;
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  const router = useRouter();
  const t = useTranslations();

  const { data: auth } = authClient.useSession();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-x-3">
        <UserAvatar
          user={{ name: user?.name ?? "", image: user?.image ?? "" }}
          className="h-9 w-9 bg-white text-[#333] flex-shrink-0"
        />
        <div className="flex flex-col items-start gap-y-0 min-w-0 flex-1">
          {user?.name && <p className="text-base font-medium text-[#333] truncate w-full">{user.name}</p>}
          {user?.email && (
            <p className="truncate text-xs text-[#666] w-full">
              {user.email}
            </p>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={!auth?.session?.activeOrganizationId}
          asChild
        >
          <Link className="flex items-center gap-x-2" href="/account">
            <Icons.account className="h-4 w-4" />
            {t("account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive hover:!text-destructive flex cursor-pointer items-center gap-x-2"
          onSelect={async (event) => {
            setIsLoading(true);
            event.preventDefault();
            await authClient.signOut();
            router.push(ROUTES.LOGIN);
          }}
        >
          <Icons.logout className="text-destructive h-4 w-4" />
          {isLoading ? <Spinner className="text-destructive" /> : t("sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
