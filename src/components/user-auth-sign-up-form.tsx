"use client";

import type { HTMLAttributes } from "react";
import type { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  INVITATION_ID_QUERY_PARAM,
  SILO_INVITATION_ID_LS,
} from "~/config/shared";
import { ROUTES } from "~/constants/routes";
import { cn } from "~/lib/utils";
import { userAuthSignUpSchema } from "~/lib/validators/auth";
import { authClient } from "~/server/auth/client";

import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type FormData = z.infer<typeof userAuthSignUpSchema>;

export function UserAuthSignUpForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ resolver: zodResolver(userAuthSignUpSchema) });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const invitationId = searchParams.get(INVITATION_ID_QUERY_PARAM);

    if (invitationId) localStorage.setItem(SILO_INVITATION_ID_LS, invitationId);
    else localStorage.removeItem(SILO_INVITATION_ID_LS);
  }, [searchParams]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const { email, name, password } = data;

    const signUpResult = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpResult?.error) {
      toast.error(
        signUpResult?.error
          ? signUpResult.error.message
          : t("something_went_wrong"),
        {
          description: t("sign_up_error_description"),
        },
      );
      setIsLoading(false);
      return;
    }

    const invitationId = localStorage.getItem(SILO_INVITATION_ID_LS);

    if (invitationId) {
      const { data } = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });

      if (data?.email !== email) {
        toast.error(t("email_does_not_match"), {
          description: t("sign_up_email_error_description"),
        });

        await authClient.deleteUser({ callbackURL: ROUTES.REGISTER });
        setIsLoading(false);
        return;
      }

      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(t("sign_up_invitation_error"), {
          description: error.message ?? t("please_try_again"),
        });

        await authClient.deleteUser({ callbackURL: ROUTES.REGISTER });
        setIsLoading(false);
        return;
      }

      localStorage.removeItem(SILO_INVITATION_ID_LS);
      toast.success("sign_up_invitation_success_title", {
        description: t("sign_up_invitation_success_description", {
          organizationName: data.organizationName,
        }),
      });
    } else {
      toast.success(t("sign_up_sucess_title"), {
        description: t("sign_up_sucess_description"),
      });
    }

    setIsLoading(false);

    router.push(ROUTES.REQUESTS);
    router.refresh();
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs" htmlFor="name">
              {t("full_name")}
            </Label>

            <Input
              id="name"
              placeholder="John Doe"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              {...register("name")}
            />

            {errors?.name && (
              <p className="text-destructive px-1 text-xs">
                {errors.name.message}
              </p>
            )}
          </div>

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

            <Input
              id="password"
              placeholder="********"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              {...register("password")}
            />

            {errors?.password && (
              <p className="text-destructive px-1 text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="grid gap-1">
            <Label
              className="text-muted-foreground text-xs"
              htmlFor="confirmPassword"
            >
              {t("confirm_password")}
            </Label>

            <Input
              id="confirmPassword"
              placeholder="********"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              {...register("confirmPassword")}
            />

            {errors?.confirmPassword && (
              <p className="text-destructive px-1 text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button disabled={isLoading || !isValid}>
            {isLoading && <Spinner />}
            {t("sign_up")}
          </Button>
        </div>
      </form>
    </div>
  );
}
