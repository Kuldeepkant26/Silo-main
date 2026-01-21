"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";

import { Icons } from "./icons";
import { Button } from "./ui/button";

interface BackButtonProps {
  className?: string;
  label?: string;
  route: (typeof ROUTES)[keyof typeof ROUTES];
}

export function BackButton({
  className,
  label = "back",
  route,
}: BackButtonProps) {
  const t = useTranslations();

  return (
    <Button className={cn("w-fit", className)} variant="link" asChild>
      <Link href={route}>
        <Icons.arrowLeft className="h-6 w-6" />
        <span>{t(label)}</span>
      </Link>
    </Button>
  );
}
