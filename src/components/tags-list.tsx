/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import { Fragment, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Tag } from "~/server/db/schema";
import { SEARCH_PARAM_TAG_ID } from "~/config/settings";
import { api } from "~/trpc/react";
import { EditTag } from "./edit-tag";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function TagsList() {
  const router = useRouter();
  const pathname = usePathname();
  const tagId = useSearchParams().get(SEARCH_PARAM_TAG_ID);

  const [tags] = api.tag.getAllByOrganization.useSuspenseQuery();
  const utils = api.useUtils();

  const t = useTranslations();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null | undefined>(
    tagId ? tags.find((t) => t.id === tagId) : null,
  );

  const deleteTagMutation = api.tag.delete.useMutation({
    onSuccess: async () => {
      toast.success(t("tags_list_delete_success"));
      setDialogOpen(false);
      setSelectedTag(null);
      await utils.tag.getAllByOrganization.invalidate();
    },
    onError: (_) => {
      toast.error(t("tags_list_delete_error", { tagName: deleteTag?.name! }));
    },
  });

  const handleRowClick = (tag: Tag) => {
    setSelectedTag(tag);
    setOpenDropdown(null);
    router.push(`${pathname}?${SEARCH_PARAM_TAG_ID}=${tag.id}`);
  };

  const handleDeleteClick = (tag: Tag) => {
    setDeleteTag(tag);
    setOpenDropdown(null);
    setDialogOpen(true);
  };

  const handleDrawerClose = () => {
    setSelectedTag(null);
    setOpenDropdown(null);
    router.push(pathname);
  };

  return !tags.length ? (
    <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
      {t("tags_list_not_found")}
    </p>
  ) : (
    <Fragment>
      <Table className="w-full">
        <TableCaption>{t("tags_list_caption")}</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("name")}</TableHead>
            <TableHead className="min-w-[200px]">{t("status")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => {
            return (
              <TableRow key={tag.id} onClick={() => handleRowClick(tag)}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell className="capitalize">
                  <Badge variant="outline">{tag.status}</Badge>
                </TableCell>
                <TableCell className="flex justify-end pr-4">
                  <DropdownMenu
                    open={openDropdown === tag.id}
                    onOpenChange={(open) =>
                      setOpenDropdown(open ? tag.id : null)
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
                          handleRowClick(tag);
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
                          handleDeleteClick(tag);
                        }}
                      >
                        <Icons.remove className="text-destructive h-4 w-4" />
                        <span>{t("remove")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("are_you_absolutely_sure")}</DialogTitle>
            <DialogDescription>
              {t("permanently_delete_message")}{" "}
              <span className="text-primary font-bold">{deleteTag?.name}</span>{" "}
              {t("tags_list_remove_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>

            <Button
              variant="destructive"
              onClick={() => deleteTagMutation.mutate({ id: deleteTag!.id })}
              className="min-w-32 justify-center"
              disabled={deleteTagMutation.isPending}
            >
              {deleteTagMutation.isPending ? (
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

      {selectedTag && (
        <EditTag tag={selectedTag} onOpenChange={handleDrawerClose} />
      )}
    </Fragment>
  );
}
