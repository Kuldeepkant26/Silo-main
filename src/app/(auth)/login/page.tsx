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
    <div className="min-h-dvh bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-[60px] py-8 w-full shrink-0">
        <Logo width={70} height={70} />
        <Link
          href={ROUTES.REGISTER}
          className="bg-transparent border-none text-base font-medium text-green-600 cursor-pointer transition-colors px-4 py-2 rounded-lg hover:text-green-700 hover:bg-green-50"
        >
          {t("create_account")}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-[60px] pb-[60px] pt-5 gap-[60px] items-center justify-center w-full">
        <div className="flex-1 max-w-[520px] w-full pl-10">
          <h1 className="text-[32px] font-semibold text-[#1a1a1a] mb-2.5 tracking-tight leading-tight">
            {t("welcome_back")}
          </h1>
          <p className="text-base text-gray-500 mb-7 leading-relaxed">
            {t("login_description")}
          </p>

          <Suspense>
            <UserAuthForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-green-600 hover:text-green-700 hover:underline text-sm"
            >
              {t("forgot_password_question")}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center max-w-[400px]">
          <div className="flex h-80 w-80 items-center justify-center rounded-[20px]">
            <svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" strokeWidth="1.5" className="h-44 w-44">
              <circle cx="50" cy="35" r="18" />
              <path d="M20 85c0-16.57 13.43-30 30-30s30 13.43 30 30" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-[60px] py-4 shrink-0">
        <button className="bg-transparent border-none text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          English
        </button>
        <button className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-50">
          ?
        </button>
      </footer>
    </div>
  );
}
