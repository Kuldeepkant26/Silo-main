import type { HTMLAttributes } from "react";

import { cn } from "~/lib/utils";

import { Icons } from "./icons";

export function Spinner({ className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Icons.spinner className={cn("mr-2 h-4 w-4 animate-spin", className)} />
  );
}
