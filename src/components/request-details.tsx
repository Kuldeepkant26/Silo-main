"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

import { Icons } from "./icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://silo-be.vercel.app";
const API_AUTH_TOKEN = process.env.NEXT_PUBLIC_API_AUTH_TOKEN ?? "BYULcaacpa9VDX2YvrKlxukCUuHJW9zA";

// Create Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface Attachment {
  Key: string;
  Id: string;
}

interface TicketPayload {
  summary?: string;
  startDate?: string;
  endDate?: string;
  attachments?: Attachment[];
}

interface TicketDetail {
  id: number;
  workflowStatus: string;
  priority: string;
  assignedTeamId: string | null;
  legalOwnerId: string | null;
  payload: TicketPayload;
  description: string;
  created_at: string;
  updated_at?: string;
}

interface RequestDetailsProps {
  id: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
    case "MEDIUM":
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "LOW":
      return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "IN_PROGRESS":
      return "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "OVERDUE":
      return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
    case "RESOLVED":
    case "CLOSED":
      return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export function RequestDetails({ id }: RequestDetailsProps) {
  const router = useRouter();
  const t = useTranslations();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/get-ticket-detail/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${API_AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch ticket details");
        }

        const data = await response.json();
        if (data.tickets && data.tickets.length > 0) {
          setTicket(data.tickets[0]);
        } else {
          throw new Error("Ticket not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetail();
  }, [id]);

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      setDownloadingAttachment(attachment.Id);
      
      // Extract bucket name and file path from the Key
      // Key format: "ticket-attachments/temp_xxx/filename.ext"
      const keyParts = attachment.Key.split("/");
      const bucketName = keyParts[0] ?? "ticket-attachments";
      const filePath = keyParts.slice(1).join("/");
      const fileName = keyParts[keyParts.length - 1] ?? "download";
      
      let fileUrl: string;
      
      if (!supabase) {
        // Fallback: try public URL if supabase client not available
        fileUrl = `${supabaseUrl}/storage/v1/object/public/${attachment.Key}`;
      } else {
        // Create signed URL using Supabase client
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (error || !data?.signedUrl) {
          console.error("Signed URL error:", error);
          // Fallback: try public URL
          fileUrl = `${supabaseUrl}/storage/v1/object/public/${attachment.Key}`;
        } else {
          fileUrl = data.signedUrl;
        }
      }
      
      // Open preview in new tab
      window.open(fileUrl, "_blank");
      
      // Also trigger download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download attachment");
    } finally {
      setDownloadingAttachment(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icons.alertCircle className="text-destructive h-12 w-12" />
        <h2 className="mt-4 text-xl font-semibold">Ticket Not Found</h2>
        <p className="text-muted-foreground mt-2">{error ?? "Unable to load ticket details"}</p>
        <Button className="mt-4" onClick={() => router.push("/requests")}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
      </div>
    );
  }

  const summary = ticket.payload?.summary ?? `Ticket #${ticket.id}`;
  const attachments = ticket.payload?.attachments ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{summary}</h1>
              <Badge variant="outline" className="text-muted-foreground">
                #{ticket.id}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Created on {format(new Date(ticket.created_at), "MMMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={`${getPriorityColor(ticket.priority)} border`}>
              {ticket.priority || "Not Set"}
            </Badge>
            <Badge className={`${getStatusColor(ticket.workflowStatus)} border`}>
              {ticket.workflowStatus ? ticket.workflowStatus.replace(/_/g, " ") : "Not Set"}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Date Range Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Icons.calendarRange className="text-primary h-4 w-4" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Start</span>
                <span className="text-sm font-medium">
                  {ticket.payload?.startDate
                    ? format(new Date(ticket.payload.startDate), "MMM dd, yyyy")
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">End</span>
                <span className="text-sm font-medium">
                  {ticket.payload?.endDate
                    ? format(new Date(ticket.payload.endDate), "MMM dd, yyyy")
                    : "Not set"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Icons.flag className="text-primary h-4 w-4" />
              Priority Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  ticket.priority === "HIGH"
                    ? "bg-red-500"
                    : ticket.priority === "MEDIUM"
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
              />
              <span className="text-lg font-semibold capitalize">
                {ticket.priority?.toLowerCase() ?? "Not set"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Icons.circleCheck className="text-primary h-4 w-4" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  ticket.workflowStatus === "OVERDUE"
                    ? "bg-red-500"
                    : ticket.workflowStatus === "OPEN"
                      ? "bg-blue-500"
                      : ticket.workflowStatus === "IN_PROGRESS"
                        ? "bg-purple-500"
                        : "bg-green-500"
                }`}
              />
              <span className="text-lg font-semibold">
                {ticket.workflowStatus?.replace(/_/g, " ") ?? "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.fileText className="text-primary h-5 w-5" />
            Description
          </CardTitle>
          <CardDescription>Original request description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {ticket.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.files className="text-primary h-5 w-5" />
              Attachments
              <Badge variant="secondary" className="ml-2">
                {attachments.length}
              </Badge>
            </CardTitle>
            <CardDescription>Files attached to this request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attachments.map((attachment) => {
                const fileName = attachment.Key?.split("/").pop() ?? "Unknown file";
                return (
                  <div
                    key={attachment.Id}
                    className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                      <Icons.file className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fileName}</p>
                      <p className="text-muted-foreground text-xs">Click to download</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleDownloadAttachment(attachment)}
                      disabled={downloadingAttachment === attachment.Id}
                    >
                      {downloadingAttachment === attachment.Id ? (
                        <Icons.spinner className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icons.download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Response Placeholder - Hidden for now */}
      {/* <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.ai className="h-5 w-5" />
            SILO Agent Response
            <Badge variant="outline" className="ml-2">
              <Icons.sparkles className="mr-1 h-3 w-3" />
              AI Powered
            </Badge>
          </CardTitle>
          <CardDescription>AI-generated analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-muted-foreground italic">
              AI analysis for this ticket will appear here. This feature is currently being
              developed to provide intelligent insights and recommendations based on the request
              content.
            </p>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
