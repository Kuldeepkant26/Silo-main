import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { ResetPassword } from "~/components/reset-password";

export default function ResetPasswordPage() {
  const t = useTranslations();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("reset_password")}
          </h1>
        </div>

        <Suspense>
          <ResetPassword />
        </Suspense>
      </div>
    </div>
  );
}
