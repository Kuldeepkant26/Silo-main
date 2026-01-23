import Link from "next/link";
import { useTranslations } from "next-intl";

import { ForgotPassword } from "~/components/forgot-password";
import { Logo } from "~/components/logo";
import { ROUTES } from "~/constants/routes";

export default function ForgotPasswordPage() {
  const t = useTranslations();

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-[60px] py-8 w-full shrink-0">
        <Logo width={70} height={70} />
        <Link
          href={ROUTES.LOGIN}
          className="bg-transparent border-none text-base font-medium text-green-600 cursor-pointer transition-colors px-4 py-2 rounded-lg hover:text-green-700 hover:bg-green-50"
        >
          {t("sign_in")}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-[60px] pb-[60px] pt-5 gap-[60px] items-center justify-center w-full">
        <div className="flex-1 max-w-[520px] w-full pl-10">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 bg-transparent border-none text-base font-medium text-green-600 cursor-pointer p-0 mb-4 transition-colors hover:text-green-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          
          <h1 className="text-[32px] font-semibold text-[#1a1a1a] mb-2.5 tracking-tight leading-tight">
            {t("forgot_password")}
          </h1>
          <p className="text-base text-gray-500 mb-7 leading-relaxed">
            {t("forgot_password_description")}
          </p>

          <ForgotPassword />
        </div>

        <div className="flex items-center justify-center max-w-[400px]">
          <div className="flex h-80 w-80 items-center justify-center rounded-[20px]">
            <svg viewBox="0 0 100 100" fill="none" stroke="#1a1a1a" strokeWidth="1.5" className="h-44 w-44">
              <rect x="25" y="45" width="50" height="40" rx="5" />
              <path d="M35 45V35c0-8.28 6.72-15 15-15s15 6.72 15 15v10" strokeLinecap="round" />
              <circle cx="50" cy="65" r="5" fill="#1a1a1a" />
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
