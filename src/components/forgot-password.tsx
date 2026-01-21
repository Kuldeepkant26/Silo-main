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
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

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
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}*</FormLabel>

                  <FormControl>
                    <Input
                      id="email"
                      placeholder="e.g. john.doe@example.com"
                      type="email"
                      required
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  {t("reset_link_email_form_description")}
                  <FormDescription></FormDescription>

                  <FormMessage className="-mt-2" />
                </FormItem>
              )}
            />

            <Button disabled={!form.formState.isValid} type="submit">
              {isLoading ? <Spinner /> : t("send_reset_link")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
