import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Logo } from "~/components/logo";
import { buttonVariants } from "~/components/ui/button";
import { UserAuthSignUpForm } from "~/components/user-auth-sign-up-form";
import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";

export default function RegisterPage() {
  const t = useTranslations();

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href={ROUTES.LOGIN}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 right-4 md:top-8 md:right-8",
        )}
      >
        Login
      </Link>
      <div className="bg-muted hidden h-full lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Logo width={72} height={72} className="mx-auto" />

            <h1 className="text-2xl font-semibold tracking-tight">
              {t("create_account")}
            </h1>

            <p className="text-muted-foreground text-sm">
              {t("create_account_description")}
            </p>
          </div>

          <Suspense>
            <UserAuthSignUpForm />
          </Suspense>

          <p className="text-muted-foreground px-8 text-center text-sm">
            {t("create_account_disclaimer")}{" "}
            <Link
              href="/terms"
              className="hover:text-brand underline underline-offset-4"
            >
              {t("terms_and_conditions")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/privacy"
              className="hover:text-brand underline underline-offset-4"
            >
              {t("privacy_policy")}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
