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

import type { MemberWithTeams } from "~/server/db/schema";
import { PEOPLE_LIST_PAGE_SIZE, SEARCH_PARAM_MEMBER_ID } from "~/config/people";
import { authClient } from "~/server/auth/client";
import { api } from "~/trpc/react";

import { EditMember } from "./edit-member";
import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Badge } from "./ui/badge";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function PeopleList() {
  const router = useRouter();
  const pathname = usePathname();
  const memberId = useSearchParams().get(SEARCH_PARAM_MEMBER_ID);

  const [members] = api.member.getAllByOrganization.useSuspenseQuery();
  const utils = api.useUtils();
  const t = useTranslations();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PEOPLE_LIST_PAGE_SIZE,
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteMember, setDeleteMember] = useState<MemberWithTeams | null>(
    null,
  );
  const [isDeleteLoading, setIsDeleteLoading] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<
    MemberWithTeams | null | undefined
  >(memberId ? members?.find((m) => m.id === memberId) : null);

  const PEOPLE_LIST_COLUMNS: ColumnDef<MemberWithTeams>[] = [
    {
      accessorKey: "user.name",
      header: () => t("name"),
    },
    {
      id: "email",
      accessorKey: "user.email",
      header: ({ column }) => (
        <div
          className="flex min-w-52 cursor-pointer items-center gap-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>{t("email")}</span>
          <Icons.arrowUpDown className="h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: () => t("role"),
      cell: ({ row }) => (
        <Badge variant="outline">{t(row.original.role)}</Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "teams",
      header: () => t("teams"),
      cell: ({ row }) => {
        const { teams } = row.original;
        const teamsFormatted = teams?.map((team) => team.name).join(", ");
        return (
          <div className="max-w-32 overflow-hidden text-ellipsis">
            {teams?.length ? teamsFormatted : "-"}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <DropdownMenu
            open={openDropdown === row.original.id}
            onOpenChange={(open) =>
              setOpenDropdown(open ? row.original.id : null)
            }
          >
            <DropdownMenuTrigger asChild>
              <Icons.more className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
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
    columns: PEOPLE_LIST_COLUMNS,
    data: members,
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

  const handleRemoveMember = async () => {
    if (!deleteMember) return;

    setIsDeleteLoading(true);

    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: deleteMember?.id,
      organizationId: deleteMember?.organizationId,
    });

    if (error) {
      toast.error(
        t("people_list_delete_error", {
          memberName: deleteMember.user?.name!,
        }),
      );
      setIsDeleteLoading(false);
      return;
    }

    toast.success(t("people_list_delete_success"));
    await utils.member.getAllByOrganization.invalidate();
    setIsDeleteLoading(false);
  };

  const handleRowClick = (member: MemberWithTeams) => {
    setSelectedMember(member);
    setOpenDropdown(null);
    router.push(`${pathname}?${SEARCH_PARAM_MEMBER_ID}=${member.id}`);
  };

  const handleDeleteClick = (member: MemberWithTeams) => {
    setDeleteMember(member);
    setOpenDropdown(null);
    setDialogOpen(true);
  };

  const handleDrawerClose = () => {
    setSelectedMember(null);
    setOpenDropdown(null);
    router.push(pathname);
  };

  return !members.length ? (
    <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
      {t("people_list_not_found")}
    </p>
  ) : (
    <Fragment>
      <div className="w-full">
        <div className="relative flex w-fit min-w-56 items-center py-4">
          <Input
            placeholder={t("filter_emails")}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            type="text"
            className="relative max-w-sm"
          />

          <Icons.search className="text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
        </div>

        <Table className="-mx-2 w-full">
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
                  colSpan={PEOPLE_LIST_COLUMNS.length}
                  className="h-12 text-center"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
              <span className="text-primary font-bold">
                {deleteMember?.user?.name}
              </span>{" "}
              {t("people_list_remove_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>

            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              className="min-w-32 justify-center"
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
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

      {selectedMember && (
        <EditMember member={selectedMember} onOpenChange={handleDrawerClose} />
      )}
    </Fragment>
  );
}
