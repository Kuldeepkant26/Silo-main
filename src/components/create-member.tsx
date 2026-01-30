"use client";

import type { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROLES } from "~/config/people";
import { inviteToOrganizationSchema } from "~/lib/validators/people";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function CreateMember() {
  const router = useRouter();
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState<boolean>(false);

  const invitePeopleForm = useForm<z.infer<typeof inviteToOrganizationSchema>>({
    resolver: zodResolver(inviteToOrganizationSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onHandleSubmit = async (
    data: z.infer<typeof inviteToOrganizationSchema>,
  ) => {
    setIsInviteLoading(true);

    const { email, role } = data;

    const { error } = await authClient.organization.inviteMember({
      email,
      role: [(role ?? "member") as "owner" | "admin" | "member"],
      resend: false,
    });

    if (error) {
      console.log(error);
      if (error.code === "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION") {
        toast.error(t("invite_user_error_already_invited", { email }));
      } else toast.error(t("invite_user_error", { email }));
      setIsInviteLoading(false);
      return;
    }

    toast.success(t("invite_user_success", { email }));
    invitePeopleForm.reset();
    setOpen(false);
    setIsInviteLoading(false);

    window.dispatchEvent(new CustomEvent("invitations-changed"));
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="min-w-28">{t("invite_user")}</Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>
          <DrawerTitle className="flex justify-center text-2xl">
            {t("invite_user")}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("invite_user_description")}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...invitePeopleForm}>
          <form
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={invitePeopleForm.handleSubmit(onHandleSubmit)}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
              <FormField
                control={invitePeopleForm.control}
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

                    <FormDescription>
                      {t("invite_user_email_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={invitePeopleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}*</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("select_role")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem
                            key={role.key}
                            value={role.value!}
                            className="capitalize"
                          >
                            {t(role.label!)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormDescription>
                      {t("invite_user_role_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="p-0">
              <Button
                disabled={!invitePeopleForm.formState.isValid}
                type="submit"
              >
                {isInviteLoading ? <Spinner /> : t("create")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}

