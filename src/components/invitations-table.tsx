"use client";

import { useTranslations } from "next-intl";

import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface InvitationsTableProps {
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
  }[];
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const t = useTranslations();

  return !invitations ? (
    <p className="text-muted-foreground col-span-1 text-sm italic sm:col-span-2 lg:col-span-3">
      {t("invitations_list_not_found")}
    </p>
  ) : (
    <Table className="w-full">
      <TableCaption>{t("invitations_list_caption")}</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="min-w-[200px]">{t("email")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          <TableHead>{t("status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => {
          return (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>{invitation.role}</TableCell>
              <TableCell className="capitalize">
                <Badge variant="outline">{invitation.status}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
