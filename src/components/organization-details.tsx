"use client";

import type z from "zod";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { editOrganizationSchema } from "~/lib/validators/organization";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
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
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

    if (error) {
      toast.error(t(""));
    } else {
      setIsEditing(false);
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    form.reset({ name: organization?.name ?? "" });
    setIsEditing(false);
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
    <div className="mt-8 flex flex-col gap-y-6">
      <h2 className="text-2xl font-bold text-foreground">{t("your_organization")}</h2>

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
                  <FormLabel className="text-foreground font-medium">{t("name")}</FormLabel>
                  {isEditing ? (
                    <FormControl>
                      <Input
                        id="name"
                        type="text"
                        required
                        autoComplete="name"
                        autoFocus
                        className="border-border focus:border-ring"
                        {...field}
                      />
                    </FormControl>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/30">
                      <span className="text-sm text-foreground">{organization?.name}</span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Edit organization name"
                      >
                        <Icons.edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                  <FormMessage className="-mt-2" />
                </FormItem>
              )}
            />

            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  disabled={isLoading || name === organization?.name}
                  type="submit"
                  className="bg-primary hover:bg-primary/90 w-fit"
                >
                  {isLoading ? <Spinner /> : t("update")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-fit"
                >
                  {t("cancel")}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );    
}