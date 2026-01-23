"use client";

import type { ReactNode } from "react";
import type z from "zod";
import { Fragment, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { createOrganizationSchema } from "~/lib/validators/organization";
import { authClient } from "~/server/auth/client";

interface OrganizationGuardProps {
  children: ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: auth } = authClient.useSession();

  const form = useForm<z.infer<typeof createOrganizationSchema>>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  if (auth?.session?.activeOrganizationId) return children;

  const onHandleSubmit = async (
    data: z.infer<typeof createOrganizationSchema>,
  ) => {
    setIsLoading(true);

    const { name } = data;

    const { error, data: orgData } = await authClient.organization.create({
      name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
    });

    if (error) {
      console.log(error);
      toast.error(t("create_organization_error", { name }));
      setIsLoading(false);
      return;
    }

    // Explicitly set the newly created organization as active
    if (orgData?.id) {
      await authClient.organization.setActive({
        organizationId: orgData.id,
      });
    }

    toast.success(t("create_organization_success", { name }));
    form.reset();
    setIsLoading(false);

    // Navigate with hard reload to ensure session is refreshed
    window.location.href = "/requests";
  };

  return (
    <Fragment>
      {children}

      <Dialog open>
        <DialogContent>
          <DialogTitle>{t("welcome_to_silo")}</DialogTitle>

          <DialogDescription>{t("onboarding_description")}</DialogDescription>

          <div>
            <Form {...form}>
              <form
                className="flex flex-grow flex-col space-y-4"
                onSubmit={form.handleSubmit(onHandleSubmit)}
              >
                <div className="flex flex-1 flex-grow flex-col space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({field }) => (
                      <FormItem>
                        <FormLabel>{t("name")}*</FormLabel>

                        <FormControl>
                          <Input
                            id="name"
                            placeholder="Your organization's name"
                            type="text"
                            required
                            autoFocus
                            {...field}
                          />
                        </FormControl>

                        <FormDescription>
                          {t("create_request_summary_form_description")}
                        </FormDescription>

                        <FormMessage className="-mt-2" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button disabled={!form.formState.isValid} type="submit">
                  {isLoading ? <Spinner /> : t("create")}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
