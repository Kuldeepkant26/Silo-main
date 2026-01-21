import type { User } from "better-auth";
import { type AvatarProps } from "@radix-ui/react-avatar";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getInitials } from "~/lib/utils";

import { Icons } from "./icons";

interface UserAvatarProps extends AvatarProps {
  user?: Pick<User, "image" | "name">;
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      {user?.image ? (
        <AvatarImage alt="Picture" src={user.image} />
      ) : (
        <AvatarFallback className="text-sm">
          <span className="sr-only">{user?.name}</span>
          {getInitials(user?.name ?? "") ?? <Icons.user className="h-6 w-6" />}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
