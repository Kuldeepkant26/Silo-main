"use client";

import type { HTMLAttributes } from "react";
import type { z } from "zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";
import { userAuthSchema } from "~/lib/validators/auth";
import { authClient } from "~/server/auth/client";

import { Spinner } from "./spinner";

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(userAuthSchema) });
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const { email, password } = data;

    const signInResult = await authClient.signIn.email({
      email,
      password,
      callbackURL: searchParams.get("from") ?? ROUTES.REQUESTS,
    });

    setIsLoading(false);

    if (signInResult?.error) {
      return toast.error(t("something_went_wrong"), {
        description: t("auth_error_description"),
      });
    }

    toast.success(t("auth_success_title"), {
      description: t("auth_success_description"),
    });
    router.push(ROUTES.REQUESTS);
    router.refresh();
  }

  return (
    <div className={cn("", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <label className="text-[15px] font-medium text-[#1a1a1a]">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-5 py-4 text-base text-[#1a1a1a] border-[1.5px] border-gray-200 rounded-[10px] outline-none transition-all hover:border-gray-300 focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)] disabled:opacity-50"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...register("email")}
          />
          {errors?.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-[15px] font-medium text-[#1a1a1a]">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full px-5 py-4 pr-12 text-base text-[#1a1a1a] border-[1.5px] border-gray-200 rounded-[10px] outline-none transition-all hover:border-gray-300 focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)] disabled:opacity-50"
              placeholder="********"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors?.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-white bg-[#1a1a1a] border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isLoading && <Spinner className="h-4 w-4" />}
          {t("sign_in")}
        </button>
      </form>
    </div>
  );
}
