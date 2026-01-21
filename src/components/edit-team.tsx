"use client";

import type z from "zod";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { TeamWithMembers } from "~/server/db/schema";
import { SEARCH_PARAM_TEAM_ID } from "~/config/teams";
import { editTeamSchema } from "~/lib/validators/team";
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
} from "./ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";

interface EditTeamProps {
  team: TeamWithMembers;
  onOpenChange: (open: boolean) => void;
}

export function EditTeam({ team, onOpenChange }: EditTeamProps) {
  const searchParams = useSearchParams();
  const teamId = searchParams.get(SEARCH_PARAM_TEAM_ID);

  const t = useTranslations();
  const utils = api.useUtils();
  const { data: members, isPending: membersLoading } =
    api.member.getAllByOrganization.useQuery();

  const [open, setOpen] = useState<boolean>(false);

  const { data: teamById } = api.team.getById.useQuery(
    { id: teamId ?? "" },
    { enabled: !!teamId && !team },
  );

  const currentTeam = team || teamById;

  const form = useForm<z.infer<typeof editTeamSchema>>({
    resolver: zodResolver(editTeamSchema),
  });

  const { mutate: editTeam, isPending } = api.team.edit.useMutation({
    onSuccess: async () => {
      toast.success(t("edit_team_success"));
      await utils.team.getAllByOrganization.invalidate();
      await utils.member.getAllByOrganization.invalidate();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (currentTeam) {
      form.reset({
        name: currentTeam?.name,
        memberIds: currentTeam.teamMembers.map((tm) => tm.memberId) || [],
      });
      setOpen(true);
    }
  }, [currentTeam, form]);

  const onHandleSubmit = (values: z.infer<typeof editTeamSchema>) => {
    if (!currentTeam) return;

    editTeam({
      id: currentTeam.id,
      name: values.name,
      memberIds: values.memberIds ?? [],
    });
  };

  const onHandleAddMember = (memberId: string) => {
    form.setValue(
      "memberIds",
      [...(form.getValues("memberIds") ?? []), memberId],
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const onHandleRemoveMember = (memberId: string) => {
    form.setValue(
      "memberIds",
      (form.getValues("memberIds") ?? []).filter((id) => id !== memberId),
      { shouldDirty: true, shouldTouch: true },
    );
  };

  const {
    formState: { isDirty },
  } = form;

  const formMemberIds = form.watch("memberIds");
  const membersToAdd = members?.filter((m) => !formMemberIds?.includes(m.id));

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>

          <DrawerTitle className="flex justify-center text-2xl">
            {team?.name}
          </DrawerTitle>

          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("edit_team_description")}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={form.handleSubmit(onHandleSubmit)}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
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
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <div className="mt-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary font-bold">{t("members")}</h2>

                  {membersToAdd && membersToAdd?.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="link">
                          <Icons.add className="text-primary h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {membersToAdd?.map((m) => (
                          <DropdownMenuItem
                            key={m.id}
                            onClick={() => onHandleAddMember(m.id)}
                          >
                            {m.user?.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {membersLoading ? (
                  <div className="mx-auto mt-4 flex w-auto items-center">
                    <Spinner className="text-primary" />
                  </div>
                ) : (
                  <Table className="-mx-2 w-full">
                    <TableBody>
                      {formMemberIds && formMemberIds.length > 0 ? (
                        formMemberIds.map((memberId) => {
                          const teamMember = members?.find(
                            (m) => m.id === memberId,
                          );
                          if (!teamMember) return null;

                          return (
                            <TableRow
                              key={teamMember.id}
                              className="hover:bg-transparent"
                            >
                              <TableCell className="py-0 font-medium">
                                {teamMember.user?.name}
                              </TableCell>
                              <TableCell className="flex justify-end p-0">
                                <Button
                                  variant="link"
                                  className="!px-1"
                                  onClick={() =>
                                    onHandleRemoveMember(teamMember.id)
                                  }
                                >
                                  <Icons.minus className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-12 text-center">
                            {t("no_results")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <DrawerFooter className="p-0">
              <Button disabled={isPending || !isDirty} type="submit">
                {isPending ? <Spinner /> : t("update")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
