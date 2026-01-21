"use client";

import type { z } from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTeamSchema } from "~/lib/validators/team";
import { api } from "~/trpc/react";

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
import { MultiSelect } from "./ui/multiselect";

export function CreateTeam() {
  const t = useTranslations();
  const utils = api.useUtils();

  const [open, setOpen] = useState(false);

  const { data: members, isLoading: isMembersLoading } =
    api.member.getAllByOrganization.useQuery();

  const teamForm = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      memberIds: [],
    },
  });

  const createTeamMutation = api.team.create.useMutation({
    onSuccess: async (data) => {
      toast.success(
        t("create_team_success", {
          teamName: data.name,
        }),
      );
      await utils.team.getAllByOrganization.invalidate();
      teamForm.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`${t("create_team_error")}: ${error.message}`);
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof createTeamSchema>) => {
    try {
      await createTeamMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const memberOptions =
    members?.map((m) => ({
      label: m.user?.name ?? m.user?.email ?? "Unknown",
      value: m.id,
    })) ?? [];

  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (!newOpenState) {
      teamForm.reset();
    }
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button className="min-w-28">{t("create_team")}</Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>
          <DrawerTitle className="flex justify-center text-2xl">
            {t("create_team")}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("create_team_description")}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...teamForm}>
          <form
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={teamForm.handleSubmit(onHandleSubmit)}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
              <FormField
                control={teamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="name"
                        placeholder="e.g. Legal Team"
                        type="text"
                        required
                        autoFocus
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t("create_team_name_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={teamForm.control}
                name="memberIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("members")}</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select members"
                        options={memberOptions}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        isLoading={isMembersLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("create_team_members_form_description")}
                    </FormDescription>
                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="p-0">
              <Button
                disabled={
                  !teamForm.formState.isValid || createTeamMutation.isPending
                }
                type="submit"
              >
                {createTeamMutation.isPending ? <Spinner /> : t("create")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
