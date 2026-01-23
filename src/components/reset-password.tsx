"use client";

import type z from "zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROUTES } from "~/constants/routes";
import { resetPasswordSchema } from "~/lib/validators/reset-password";
import { authClient } from "~/server/auth/client";

import { Spinner } from "./spinner";

export function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const token = searchParams.get("token")!;

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("reset_password_success"));
      router.push(ROUTES.LOGIN);
    }

    setIsLoading(false);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label className="text-[15px] font-medium text-[#1a1a1a]">
          {t("password")}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full px-5 py-4 pr-14 text-base text-[#1a1a1a] border-[1.5px] border-gray-200 rounded-[10px] outline-none transition-all hover:border-gray-300 focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)] disabled:opacity-50"
            placeholder="Enter your new password"
            disabled={isLoading}
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <label className="text-[15px] font-medium text-[#1a1a1a]">
          {t("confirm_password")}
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="w-full px-5 py-4 pr-14 text-base text-[#1a1a1a] border-[1.5px] border-gray-200 rounded-[10px] outline-none transition-all hover:border-gray-300 focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)] disabled:opacity-50"
            placeholder="Confirm your new password"
            disabled={isLoading}
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!form.formState.isValid || isLoading}
        className="inline-flex items-center justify-center gap-2 px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-white bg-[#1a1a1a] border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
      >
        {isLoading && <Spinner className="h-4 w-4" />}
        {t("reset_password")}
      </button>
    </form>
  );
}
