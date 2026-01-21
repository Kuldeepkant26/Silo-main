"use client";

import type z from "zod";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { MemberWithTeams, Team } from "~/server/db/schema";
import { ROLES, SEARCH_PARAM_MEMBER_ID } from "~/config/people";
import { editMemberSchema } from "~/lib/validators/people";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";

interface EditMemberProps {
  member: MemberWithTeams;
  onOpenChange: (open: boolean) => void;
}

export function EditMember({ member, onOpenChange }: EditMemberProps) {
  const searchParams = useSearchParams();
  const memberId = searchParams.get(SEARCH_PARAM_MEMBER_ID);

  const t = useTranslations();
  const utils = api.useUtils();
  const { data: teams, isPending: teamsLoading } =
    api.team.getAllByOrganization.useQuery();

  const [open, setOpen] = useState<boolean>(false);

  const { data: memberById } = api.member.getById.useQuery(
    { id: memberId ?? "" },
    { enabled: !!memberId && !member },
  );

  const currentMember = member || memberById;

  const form = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
  });

  const { mutate: editMember, isPending } = api.member.edit.useMutation({
    onSuccess: async () => {
      toast.success(t("edit_member_success"));
      await utils.member.getAllByOrganization.invalidate();
      await utils.team.getAllByOrganization.invalidate();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (currentMember) {
      form.reset({
        email: currentMember.user?.email,
        role: currentMember.role,
        teams: currentMember.teams?.map((team) => team.id) || [],
      });
      setOpen(true);
    }
  }, [currentMember, form]);

  const onHandleSubmit = (values: z.infer<typeof editMemberSchema>) => {
    if (!currentMember) return;

    editMember({
      id: currentMember.id,
      role: values.role,
      teams: values.teams,
    });
  };

  const onHandleAddTeam = (team: Team) => {
    const currentTeams = form.getValues("teams") ?? [];

    if (!currentTeams.includes(team.id)) {
      const newTeams = [...currentTeams, team.id];
      form.setValue("teams", newTeams, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const onHandleRemoveTeam = (team: Team) => {
    const currentTeams = form.getValues("teams") ?? [];
    const newTeams = currentTeams.filter((teamId) => teamId !== team.id);
    form.setValue("teams", newTeams, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const {
    formState: { isDirty },
  } = form;

  const formTeams = form.watch("teams") ?? [];
  const teamsToAdd = teams?.filter((team) => !formTeams.includes(team.id));

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>

          <DrawerTitle className="flex justify-center text-2xl">
            {member?.user?.name}
          </DrawerTitle>

          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("edit_member_description")}
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
                name="email"
                disabled
                render={() => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="text"
                        value={currentMember.user?.email}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                          <SelectValue placeholder="Select a role" />
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

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <div className="mt-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary font-bold">{t("teams")}</h2>

                  {teamsToAdd && teamsToAdd?.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="link">
                          <Icons.add className="text-primary h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {teamsToAdd?.map((team) => (
                          <DropdownMenuItem
                            key={team.id}
                            onClick={() => onHandleAddTeam(team)}
                          >
                            {team.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {teamsLoading ? (
                  <div className="mx-auto mt-4 flex w-auto items-center">
                    <Spinner className="text-primary" />
                  </div>
                ) : (
                  <Table className="-mx-2 w-full">
                    <TableBody>
                      {formTeams.length > 0 ? (
                        formTeams.map((teamId) => {
                          const teamData = teams?.find((t) => t.id === teamId);
                          if (!teamData) return null;

                          return (
                            <TableRow
                              key={teamData.id}
                              className="hover:bg-transparent"
                            >
                              <TableCell className="py-0 font-medium">
                                {teamData.name}
                              </TableCell>
                              <TableCell className="flex justify-end p-0">
                                <Button
                                  variant="link"
                                  className="!px-1"
                                  onClick={() => onHandleRemoveTeam(teamData)}
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
