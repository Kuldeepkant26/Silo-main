import Link from "next/link";
import { useTranslations } from "next-intl";

import { ForgotPassword } from "~/components/forgot-password";
import { Icons } from "~/components/icons";
import { buttonVariants } from "~/components/ui/button";
import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";

export default function ForgotPasswordPage() {
  const t = useTranslations();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href={ROUTES.LOGIN}
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
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("forgot_password")}
          </h1>

          <p className="text-muted-foreground text-sm">
            {t("forgot_password_description")}
          </p>
        </div>

        <ForgotPassword />
      </div>
    </div>
  );
}
