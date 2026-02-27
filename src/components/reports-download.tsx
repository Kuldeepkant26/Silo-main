"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { env } from "~/env";
import { getSessionAuthHeader } from "~/lib/api-auth";
import { authClient } from "~/server/auth/client";
import { api } from "~/trpc/react";

import { Icons } from "./icons";
import { Button } from "./ui/button";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

type ReportFormat = "excel" | "pdf";

export function ReportsDownload() {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const [loadingFormat, setLoadingFormat] = useState<ReportFormat | null>(null);

  const organizationId = auth?.session?.activeOrganizationId;

  const { data: userRole } = api.member.getCurrentUserRole.useQuery(undefined, {
    enabled: !!organizationId,
  });

  // Only admins and owners can download reports
  if (!userRole?.isAdmin) return null;

  async function handleDownload(format: ReportFormat) {
    if (!organizationId) return;

    setLoadingFormat(format);

    try {
      const authHeader = getSessionAuthHeader(auth);
      const response = await fetch(
        `${API_BASE_URL}/api/reports/usage?organizationId=${organizationId}&format=${format}`,
        {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to download report (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const extension = format === "excel" ? "xlsx" : "pdf";
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `usage-report-${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Report download failed:", error);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:block">{t("download_report")}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={!organizationId || loadingFormat !== null}
        onClick={() => handleDownload("excel")}
        className="flex items-center gap-1.5"
      >
        {loadingFormat === "excel" ? (
          <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icons.download className="h-3.5 w-3.5" />
        )}
        Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={!organizationId || loadingFormat !== null}
        onClick={() => handleDownload("pdf")}
        className="flex items-center gap-1.5"
      >
        {loadingFormat === "pdf" ? (
          <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icons.download className="h-3.5 w-3.5" />
        )}
        PDF
      </Button>
    </div>
  );
}
