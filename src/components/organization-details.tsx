"use client";

import type z from "zod";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { editOrganizationSchema } from "~/lib/validators/organization";
import { authClient } from "~/server/auth/client";

import { GeneralSettingsSkeleton } from "./skeletons/general-settings-skeleton";
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

export function OrganizationDetails() {
  const t = useTranslations();

  const { data: organization, isPending } = authClient.useActiveOrganization();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof editOrganizationSchema>>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: organization?.name ?? "",
    },
  });

  const onHandleSubmit = async (
    values: z.infer<typeof editOrganizationSchema>,
  ) => {
    if (!values.name) return;

    setIsLoading(true);

    const { error } = await authClient.organization.update({
      organizationId: organization?.id,
      data: {
        name: values.name,
      },
    });

    if (error) toast.error(t(""));

    setIsLoading(false);
  };

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
      });
    }
  }, [organization, form]);

  const name = form.watch("name");

  if (isPending) return <GeneralSettingsSkeleton />;

  return (
    <div className="mt-8 flex flex-col gap-y-4">
      <h1 className="text-primary font-bold">{t("your_organization")}</h1>

      <div className="grid grid-cols-1 pb-8">
        <Form {...form}>
          <form
            className="flex flex-grow flex-col space-y-4"
            onSubmit={form.handleSubmit(onHandleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="-mt-2" />
                </FormItem>
              )}
            />

            <Button
              disabled={isLoading || name === organization?.name}
              type="submit"
            >
              {isLoading ? <Spinner /> : t("update")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
