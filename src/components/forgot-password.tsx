"use client";

import type z from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROUTES } from "~/constants/routes";
import { forgotPasswordSchema } from "~/lib/validators/forgot-password";
import { authClient } from "~/server/auth/client";

import { Spinner } from "./spinner";

export function ForgotPassword() {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);

    const { error } = await authClient.forgetPassword({
      email: data.email,
      redirectTo: ROUTES.RESET_PASSWORD,
    });

    if (error) toast.error(error.message ?? t("generic_error"));
    else toast.success(t("reset_link_success"));

    setIsLoading(false);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label className="text-[15px] font-medium text-foreground">
          {t("email")}
        </label>
        <input
          type="email"
          className="w-full px-5 py-4 text-base text-foreground bg-background border-[1.5px] border-border rounded-[10px] outline-none transition-all hover:border-muted-foreground/50 focus:border-ring focus:shadow-[0_0_0_3px_rgba(var(--ring),0.1)] disabled:opacity-50"
          placeholder="e.g. john.doe@example.com"
          disabled={isLoading}
          {...form.register("email")}
        />
        <p className="text-sm text-muted-foreground">{t("reset_link_email_form_description")}</p>
        {form.formState.errors.email && (
          <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!form.formState.isValid || isLoading}
        className="inline-flex items-center justify-center gap-2 px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-primary-foreground bg-primary border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
      >
        {isLoading && <Spinner className="h-4 w-4" />}
        {t("send_reset_link")}
      </button>
    </form>
  );
}
