import { Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Logo } from "~/components/logo";
import { ResetPassword } from "~/components/reset-password";
import { ROUTES } from "~/constants/routes";

export default function ResetPasswordPage() {
  const t = useTranslations();

  return (
    <div className="min-h-dvh bg-background flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-5 sm:px-8 md:px-[60px] py-6 md:py-8 w-full shrink-0">
        <Logo width={70} height={70} />
        <Link
          href={ROUTES.LOGIN}
          className="bg-transparent border-none text-sm sm:text-base font-medium text-green-600 dark:text-green-400 cursor-pointer transition-colors px-3 sm:px-4 py-2 rounded-lg hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
        >
          {t("sign_in")}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-5 sm:px-8 md:px-[60px] pb-8 md:pb-[60px] pt-5 gap-8 md:gap-[60px] items-center justify-center w-full flex-col md:flex-row">
        <div className="flex-1 max-w-[520px] w-full md:pl-10">
          <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-semibold text-foreground mb-2.5 tracking-tight leading-tight">
            {t("reset_password")}
          </h1>
          <p className="text-base text-muted-foreground mb-7 leading-relaxed">
            Enter your new password below
          </p>

          <Suspense>
            <ResetPassword />
          </Suspense>
        </div>

        <div className="hidden md:flex items-center justify-center max-w-[400px]">
          <div className="flex h-80 w-80 items-center justify-center rounded-[20px]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-44 w-44 text-foreground">
              <rect x="25" y="45" width="50" height="40" rx="5" />
              <path d="M35 45V35c0-8.28 6.72-15 15-15s15 6.72 15 15v10" strokeLinecap="round" />
              <circle cx="50" cy="65" r="5" fill="currentColor" />
            </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-5 sm:px-8 md:px-[60px] py-4 shrink-0">
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
