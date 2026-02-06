import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Logo } from "~/components/logo";
import { UserAuthForm } from "~/components/user-auth-form";
import { ROUTES } from "~/constants/routes";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="min-h-dvh bg-background flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-[60px] py-8 w-full shrink-0">
        <Logo width={70} height={70} />
        <Link
          href={ROUTES.REGISTER}
          className="bg-transparent border-none text-base font-medium text-green-600 dark:text-green-400 cursor-pointer transition-colors px-4 py-2 rounded-lg hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
        >
          {t("create_account")}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-[60px] pb-[60px] pt-5 gap-[60px] items-center justify-center w-full">
        <div className="flex-1 max-w-[520px] w-full pl-10">
          <h1 className="text-[32px] font-semibold text-foreground mb-2.5 tracking-tight leading-tight">
            {t("welcome_back")}
          </h1>
          <p className="text-base text-muted-foreground mb-7 leading-relaxed">
            {t("login_description")}
          </p>

          <Suspense>
            <UserAuthForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline text-sm"
            >
              {t("forgot_password_question")}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center max-w-[400px]">
          <div className="flex h-80 w-80 items-center justify-center rounded-[20px]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-44 w-44 text-foreground">
              <circle cx="50" cy="35" r="18" />
              <path d="M20 85c0-16.57 13.43-30 30-30s30 13.43 30 30" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-[60px] py-4 shrink-0">
        <button className="bg-transparent border-none text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          English
        </button>
        <button className="w-8 h-8 rounded-full border border-border bg-background text-muted-foreground text-sm font-medium cursor-pointer hover:bg-muted">
          ?
        </button>
      </footer>
    </div>
  );
}
