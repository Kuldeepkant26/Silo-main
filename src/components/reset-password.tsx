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
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const token = searchParams.get("token")!;

  const [isLoading, setIsLoading] = useState(false);

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
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>

                  <FormControl>
                    <Input
                      id="password"
                      placeholder="********"
                      type="password"
                      required
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="-mt-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirm_password")}</FormLabel>

                  <FormControl>
                    <Input
                      id="confirmPassword"
                      placeholder="********"
                      type="password"
                      required
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="-mt-2" />
                </FormItem>
              )}
            />

            <Button disabled={!form.formState.isValid} type="submit">
              {isLoading ? <Spinner /> : t("reset_password")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
