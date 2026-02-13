/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Fragment, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { TeamWithMembers } from "~/server/db/schema";
import { SEARCH_PARAM_TEAM_ID, TEAM_LIST_PAGE_SIZE } from "~/config/teams";
import { api } from "~/trpc/react";

import { EditTeam } from "./edit-team";
import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function TeamsList() {
  const router = useRouter();
  const pathname = usePathname();
  const teamId = useSearchParams().get(SEARCH_PARAM_TEAM_ID);

  const [teams] = api.team.getAllByOrganization.useSuspenseQuery();
  const utils = api.useUtils();
  const t = useTranslations();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: TEAM_LIST_PAGE_SIZE,
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteTeam, setDeleteTeam] = useState<TeamWithMembers | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<
    TeamWithMembers | null | undefined
  >(teamId ? teams?.find((t) => t.id === teamId) : null);

  const TEAMS_LIST_COLUMNS: ColumnDef<TeamWithMembers>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <div
          className="flex min-w-52 cursor-pointer items-center gap-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>{t("name")}</span>
          <Icons.arrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original?.name}</div>
      ),
    },
    {
      id: "members",
      accessorKey: "members",
      header: () => t("members"),
      cell: ({ row }) => (
        <div className="pl-8">{row.original.teamMembers.length}</div>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <DropdownMenu
            open={openDropdown === row.original?.id}
            onOpenChange={(open) =>
              setOpenDropdown(open ? row.original?.id : null)
            }
          >
            <DropdownMenuTrigger asChild>
              <Icons.more className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRowClick(row.original);
                }}
              >
                <Icons.edit className="h-4 w-4" />
                <span>{t("edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive hover:!text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteClick(row.original);
                }}
              >
                <Icons.remove className="text-destructive h-4 w-4" />
                <span>{t("remove")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    columns: TEAMS_LIST_COLUMNS,
    data: teams,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  const deleteTeamMutation = api.team.delete.useMutation({
    onSuccess: async () => {
      toast.success(t("teams_list_delete_success"));
      setDialogOpen(false);
      setSelectedTeam(null);
      await utils.team.getAllByOrganization.invalidate();
    },
    onError: (_) => {
      toast.error(
        t("teams_list_delete_error", {
          teamName: deleteTeam?.name!,
        }),
      );
    },
  });

  const handleRowClick = (team: TeamWithMembers) => {
    setSelectedTeam(team);
    setOpenDropdown(null);
    router.push(`${pathname}?${SEARCH_PARAM_TEAM_ID}=${team.id}`);
  };

  const handleDeleteClick = (team: TeamWithMembers) => {
    setDeleteTeam(team);
    setOpenDropdown(null);
    setDialogOpen(true);
  };

  const handleDrawerClose = () => {
    setSelectedTeam(null);
    setOpenDropdown(null);
    router.push(pathname);
  };

  return !teams?.length ? (
    <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
      {t("teams_list_not_found")}
    </p>
  ) : (
    <Fragment>
      <div className="w-full">
        <div className="relative flex w-fit min-w-56 items-center py-4">
          <Input
            placeholder={t("filter_names")}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            type="text"
            className="relative max-w-sm"
          />

          <Icons.search className="text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
        </div>

        <div className="overflow-x-auto">
        <Table className="-mx-2 w-full min-w-[500px]">
          <TableCaption>{t("teams_list_caption")}</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={TEAMS_LIST_COLUMNS.length}
                  className="h-12 text-center"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            <span>
              {table.getRowModel().rows.length} {t("of")}{" "}
              {table.getFilteredRowModel().rows.length} {t("results_shown")}
            </span>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("are_you_absolutely_sure")}</DialogTitle>
            <DialogDescription>
              {t("permanently_delete_message")}{" "}
              <span className="text-primary font-bold">{deleteTeam?.name}</span>{" "}
              {t("teams_list_remove_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>

            <Button
              variant="destructive"
              onClick={() =>
                deleteTeamMutation.mutate({ teamId: deleteTeam!.id })
              }
              className="min-w-32 justify-center"
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? (
                <Spinner />
              ) : (
                <div className="flex items-center gap-x-2">
                  <Icons.remove className="h-4 w-4" />
                  {t("continue")}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTeam && (
        <EditTeam team={selectedTeam} onOpenChange={handleDrawerClose} />
      )}
    </Fragment>
  );
}
