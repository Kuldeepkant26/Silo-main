/* eslint-disable @typescript-eslint/no-floating-promises */
"use client";

import type { Invitation } from "better-auth/plugins";
import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { Role } from "~/server/db/auth";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";

import { Icons } from "./icons";
import { PeopleListSkeleton } from "./skeletons";
import { Spinner } from "./spinner";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function InvitationsList() {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResendLoading, setIsResendLoading] = useState<boolean>(false);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
    [],
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleInvitationsChanged = () => {
      fetchInvitations();
    };

    window.addEventListener("invitations-changed", handleInvitationsChanged);

    handleInvitationsChanged();

    return () => {
      window.removeEventListener(
        "invitations-changed",
        handleInvitationsChanged,
      );
    };
  }, []);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const { data: invitations } =
        await authClient.organization.listInvitations();

      const pendingInvitations = invitations?.filter(
        (invitation) => invitation.status === "pending",
      );

      if (!pendingInvitations?.length) {
        setPendingInvitations([]);
        return;
      }

      const uniqueInvitationsMap = new Map<string, Invitation>();
      for (const invitation of pendingInvitations) {
        if (!uniqueInvitationsMap.has(invitation.email)) {
          uniqueInvitationsMap.set(invitation.email, invitation);
        }
      }

      const uniqueInvitations = Array.from(uniqueInvitationsMap.values()).sort(
        (a, b) => a.email.localeCompare(b.email),
      );

      setPendingInvitations(uniqueInvitations);
    } catch (_) {
      // TODO: Handle error gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async (e: Event, invitation: Invitation) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResendLoading(true);

    await authClient.organization.inviteMember({
      email: invitation.email,
      role: invitation.role as "owner" | "admin" | "member",
      organizationId: invitation.organizationId,
      resend: true,
    });

    setOpenDropdown(null);

    toast.success(t("invite_user_success", { email: invitation.email }));
    setIsResendLoading(false);
  };

  const isInvitationPending = (status: Invitation["status"]) =>
    status !== "pending";

  if (isLoading) return <PeopleListSkeleton />;

  return (
    <Fragment>
      <div className="flex flex-col gap-y-4">
        <h1 className="text-primary pl-2 text-lg font-bold">
          {t("pending_invitations")}
        </h1>
      </div>

      {!pendingInvitations ? (
        <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
          {t("invitations_list_not_found")}
        </p>
      ) : (
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingInvitations.map((invitation) => {
              const isPending = isInvitationPending(invitation.status);

              return (
                <TableRow key={invitation.id}>
                  <TableCell
                    className={cn("font-medium", {
                      "line-through": isPending,
                    })}
                  >
                    {invitation.email}
                  </TableCell>
                  <TableCell>
                    {isPending ? (
                      "-"
                    ) : (
                      <Badge variant="outline">{t(invitation.role)}</Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn({
                      "text-destructive italic": isPending,
                    })}
                  >
                    {t(invitation.status)}
                  </TableCell>
                  <TableCell className="flex justify-end pr-4">
                    <DropdownMenu
                      open={openDropdown === invitation.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? invitation.id : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Icons.more className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => onResend(e, invitation)}
                        >
                          {isResendLoading ? (
                            <Spinner />
                          ) : (
                            <Fragment>
                              <Icons.resend className="h-4 w-4" />
                              <span>{t("resend")}</span>
                            </Fragment>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Fragment>
  );
}
