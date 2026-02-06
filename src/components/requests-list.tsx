"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

import { env } from "~/env";
import { ROUTES } from "~/constants/routes";
import { authClient } from "~/server/auth/client";
import { cn } from "~/lib/utils";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Skeleton } from "./ui/skeleton";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

interface Ticket {
  id: number;
  email: string;
  priority: string;
  workflowStatus: string;
  reviewed: boolean;
  legalOwnerId: string;
  reviewerId: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  attachments: Array<{ Key: string; Id: string }>;
  sourceType: string;
  category: { id: number; name: string } | null;
  requestForm: { id: number; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string | null;
}

interface TicketsResponse {
  count: number;
  tickets: Ticket[];
}

const priorityStyles: Record<string, { bg: string; text: string; dot: string }> = {
  HIGH: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  MEDIUM: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  LOW: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  DONE: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-800 dark:text-emerald-300" },
  OVERDUE: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-800 dark:text-red-300" },
  REOPEN: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-300" },
  PENDING: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-800 dark:text-blue-300" },
  IN_PROGRESS: { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-800 dark:text-violet-300" },
  OPEN: { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-800 dark:text-sky-300" },
};

type SortOrder = "newest" | "oldest";

interface Filters {
  priority: string;
  status: string;
  category: string;
  sourceType: string;
}

export function RequestsList() {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    priority: "",
    status: "",
    category: "",
    sourceType: "",
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const userId = auth?.user?.id;
  const organizationId = auth?.session?.activeOrganizationId;

  const fetchTickets = useCallback(async () => {
    if (!userId || !organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-all-tickets?user_id=${userId}&organization_id=${organizationId}`,
        {
          headers: {
            "Authorization": AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        // Handle non-ok responses gracefully - show empty state
        console.warn("Tickets API returned status:", response.status);
        setTickets([]);
        setError(null);
        return;
      }

      const data: TicketsResponse = await response.json();
      // Show all tickets
      setTickets(data.tickets || []);
      setError(null);
    } catch (err) {
      console.warn("Error fetching tickets:", err);
      // Show empty state on error instead of error message
      setTickets([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, organizationId]);

  // Fetch tickets on mount and when dependencies change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Listen for new request created event to refresh the list
  useEffect(() => {
    const handleRequestCreated = () => {
      fetchTickets();
    };

    window.addEventListener("internal-request-created", handleRequestCreated);
    return () => {
      window.removeEventListener("internal-request-created", handleRequestCreated);
    };
  }, [fetchTickets]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = tickets
      .map((ticket) => ticket.category?.name)
      .filter((cat): cat is string => Boolean(cat));
    return [...new Set(categories)];
  }, [tickets]);

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let items = [...tickets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (ticket) =>
          ticket.summary?.toLowerCase().includes(query) ||
          ticket.email.toLowerCase().includes(query) ||
          ticket.category?.name.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (selectedFilters.priority) {
      items = items.filter((ticket) => ticket.priority === selectedFilters.priority);
    }

    // Apply status filter
    if (selectedFilters.status) {
      items = items.filter((ticket) => ticket.workflowStatus === selectedFilters.status);
    }

    // Apply category filter
    if (selectedFilters.category) {
      items = items.filter((ticket) => ticket.category?.name === selectedFilters.category);
    }

    // Apply source type filter
    if (selectedFilters.sourceType) {
      items = items.filter((ticket) => ticket.sourceType === selectedFilters.sourceType);
    }

    // Apply sort
    items.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [tickets, searchQuery, selectedFilters, sortOrder]);

  // Count pending tickets
  const pendingCount = useMemo(() => {
    return tickets.filter((t) => t.workflowStatus === "PENDING" || t.workflowStatus === "OPEN").length;
  }, [tickets]);

  // Badge helper functions
  const getPriorityBadge = (priority: string) => {
    const style = priorityStyles[priority] || priorityStyles.LOW;
    return (
      <Badge className={cn(style?.bg, style?.text, "font-medium px-3 py-1 rounded-md min-w-[70px] justify-center")}>
        <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", style?.dot)} />
        {priority || "NOT SET"}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const style = statusStyles[status] || statusStyles.PENDING;
    const displayStatus = status?.replace(/_/g, " ") || "PENDING";
    return (
      <Badge className={cn(style?.bg, style?.text, "font-medium px-3 py-1 rounded-md min-w-[80px] justify-center")}>
        {displayStatus}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[200px] rounded-full" />
          <Skeleton className="h-9 w-[120px] rounded-full" />
          <Skeleton className="h-9 w-[130px] rounded-full" />
          <Skeleton className="h-9 w-[140px] rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="border rounded-lg overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-6 w-[70px] rounded" />
              <Skeleton className="h-6 w-[80px] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Icons.warning className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Icons.files className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first internal request to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filters Row */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px] rounded-full border-[#ccc]"
            />
          </div>

          {/* Source Type Filter */}
          <Select 
            value={selectedFilters.sourceType} 
            onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, sourceType: value === "all" ? "" : value }))}
          >
            <SelectTrigger className="w-[120px] rounded-full border-[#ccc]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select 
            value={selectedFilters.priority} 
            onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, priority: value === "all" ? "" : value }))}
          >
            <SelectTrigger className="w-[120px] rounded-full border-[#ccc]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select 
            value={selectedFilters.status} 
            onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
          >
            <SelectTrigger className="w-[130px] rounded-full border-[#ccc]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="REOPEN">Reopen</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {uniqueCategories.length > 0 && (
            <Select 
              value={selectedFilters.category} 
              onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}
            >
              <SelectTrigger className="w-[140px] rounded-full border-[#ccc]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters Button */}
          {(selectedFilters.priority || selectedFilters.status || selectedFilters.category || selectedFilters.sourceType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFilters({ priority: "", status: "", category: "", sourceType: "" })}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.close className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
              <SelectTrigger className="w-[140px] rounded-full border-[#ccc]">
                <SelectValue placeholder={t("newest_first")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("newest_first")}</SelectItem>
                <SelectItem value="oldest">{t("oldest_first")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pending Requests Banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-muted dark:bg-muted/50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Info className="h-4 w-4" />
              <span>
                {pendingCount} request{pendingCount !== 1 ? "s" : ""} pending
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-card hover:bg-card border-b">
              <TableHead className="font-bold text-foreground">Source</TableHead>
              <TableHead className="font-bold text-foreground">Title</TableHead>
              <TableHead className="font-bold text-foreground">Email</TableHead>
              <TableHead className="font-bold text-foreground">Category</TableHead>
              <TableHead className="font-bold text-foreground">Created At</TableHead>
              <TableHead className="font-bold text-foreground">Priority</TableHead>
              <TableHead className="font-bold text-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {tickets.length === 0 
                    ? "No requests yet. Create your first internal request to get started."
                    : "No requests match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                // For INTERNAL tickets, use summary; for EXTERNAL, use requestForm.name
                const title = ticket.sourceType === "INTERNAL" 
                  ? (ticket.summary || "") 
                  : (ticket.requestForm?.name || "");
                
                return (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Badge variant="outline" className={cn(
                        "font-medium",
                        ticket.sourceType === "INTERNAL" 
                          ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300" 
                          : "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                      )}>
                        {ticket.sourceType || "INTERNAL"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <Link 
                        href={`${ROUTES.REQUESTS}/${ticket.id}`}
                        className="block truncate font-medium text-foreground hover:underline"
                      >
                        {title || "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{ticket.email}</TableCell>
                    <TableCell>{ticket.category?.name || "-"}</TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.workflowStatus)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className="mt-3 px-1">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredTickets.length}</span> of{" "}
          <span className="font-medium text-foreground">{tickets.length}</span> request{tickets.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
