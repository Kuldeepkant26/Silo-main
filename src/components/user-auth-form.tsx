"use client";

import type { HTMLAttributes } from "react";
import type { z } from "zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";
import { userAuthSchema } from "~/lib/validators/auth";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs" htmlFor="email">
              {t("email")}
            </Label>

            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />

            {errors?.email && (
              <p className="text-destructive px-1 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs" htmlFor="password">
              {t("password")}
            </Label>

            <div className="relative">
              <Input
                id="password"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
                {...register("password")}
              />

              <Button
                className="hover:text-chart-1 absolute top-0 right-2 h-full p-0 hover:bg-transparent"
                variant="ghost"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                asChild
              >
                {!showPassword ? (
                  <Icons.eyeClosed className="text-muted-foreground h-4 w-4" />
                ) : (
                  <Icons.eye className="text-muted-foreground h-4 w-4" />
                )}
              </Button>
            </div>

            {errors?.password && (
              <p className="text-destructive px-1 text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button className="mt-1" disabled={isLoading}>
            {isLoading && <Spinner />}
            {t("sign_in")}
          </Button>
        </div>
      </form>
    </div>
  );
}
