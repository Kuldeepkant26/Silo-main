import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Icons } from "~/components/icons";
import { Logo } from "~/components/logo";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { UserAuthForm } from "~/components/user-auth-form";
import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 left-4 md:top-8 md:left-8",
        )}
      >
        <>
          <Icons.chevronLeft className="h-4 w-4" />
          {t("back")}
        </>
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Logo width={72} height={72} className="mx-auto" />

          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcome_back")}
          </h1>

          <p className="text-muted-foreground text-sm">
            {t("login_description")}
          </p>
        </div>

        <Suspense>
          <UserAuthForm />
        </Suspense>

        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="hover:text-brand underline underline-offset-4"
        >
          <p className="text-muted-foreground -mt-2 px-8 text-center text-sm">
            {t("forgot_password_question")}
          </p>
        </Link>

        <div className="relative flex items-center justify-center text-xs uppercase">
          <Separator />
          <span className="bg-background text-muted-foreground px-2">
            {t("or")}
          </span>
          <Separator />
        </div>

        <Link
          href={ROUTES.REGISTER}
          className={cn("w-full", buttonVariants({ variant: "outline" }))}
        >
          {t("create_account")}
        </Link>
      </div>
    </div>
  );
}
