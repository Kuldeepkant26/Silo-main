"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";

import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { ReviewDetailPanel } from "./review-detail-panel";
import { CreateRequest } from "./create-request";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

// Types based on API response
interface RequestForm {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  email: string;
  priority: "HIGH" | "MID" | "LOW" | null;
  workflowStatus: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null;
  legalOwnerId: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  attachments: string[] | null;
  reviewed: boolean;
  createdAt: string;
  updatedAt: string | null;
  sourceType: "EXTERNAL" | "INTERNAL";
  category: Category | null;
  requestForm: RequestForm | null;
}

// Request item for display
interface RequestItem {
  id: string;
  type: string;
  title: string;
  email: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  reviewed: boolean;
  urgency: "LOW" | "HIGH" | "MID" | null;
  workflowStatus: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null;
  category: string | null;
}

type SortOrder = "newest" | "oldest";

interface Filters {
  priority: string;
  status: string;
  category: string;
  sourceType: string;
}

export function MyRequestsList() {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const userEmail = auth?.user?.email;
  const userId = auth?.user?.id;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    priority: "",
    status: "",
    category: "",
    sourceType: "",
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Fetch tickets for the current user
  const fetchTickets = useCallback(async () => {
    if (!userId || !organizationId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-all-tickets?user_id=${userId}&organization_id=${organizationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter tickets to show only the ones created by the current user
        const userTickets = (data.tickets || []).filter(
          (ticket: Ticket) => ticket.email === userEmail
        );
        setTickets(userTickets);
      } else {
        console.error("Failed to fetch tickets");
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Error connecting to server");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId, userEmail]);

  // Initial data fetch
  useEffect(() => {
    if (organizationId && userEmail) {
      fetchTickets();
    }
  }, [organizationId, userEmail, fetchTickets]);

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

  // Transform tickets to RequestItem format for table display
  const requestItems: RequestItem[] = useMemo(() => {
    return tickets.map((ticket) => ({
      id: String(ticket.id),
      type: ticket.sourceType || "INTERNAL",
      title: ticket.sourceType === "INTERNAL" 
        ? (ticket.summary || "") 
        : (ticket.requestForm?.name || ""),
      email: ticket.email || "",
      createdAt: ticket.createdAt,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      reviewed: ticket.reviewed,
      urgency: ticket.priority,
      workflowStatus: ticket.workflowStatus,
      category: ticket.category?.name || null,
    }));
  }, [tickets]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = tickets
      .map((t) => t.category?.name)
      .filter((c): c is string => !!c);
    return [...new Set(categories)];
  }, [tickets]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...requestItems];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.type.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      );
    }

    // Apply priority filter
    if (selectedFilters.priority) {
      items = items.filter((item) => item.urgency === selectedFilters.priority);
    }

    // Apply status filter
    if (selectedFilters.status) {
      items = items.filter((item) => item.workflowStatus === selectedFilters.status);
    }

    // Apply category filter
    if (selectedFilters.category) {
      items = items.filter((item) => item.category === selectedFilters.category);
    }

    // Apply source type filter
    if (selectedFilters.sourceType) {
      items = items.filter((item) => item.type === selectedFilters.sourceType);
    }

    // Apply sort
    items.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [requestItems, searchQuery, selectedFilters, sortOrder]);

  const handleRowClick = (item: RequestItem) => {
    setSelectedRequest(item);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedRequest(null);
  };

  const handleNavigateRequest = (direction: "prev" | "next") => {
    if (!selectedRequest) return;
    const currentIndex = filteredItems.findIndex(
      (item) => item.id === selectedRequest.id
    );
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredItems.length) {
      setSelectedRequest(filteredItems[newIndex]!);
    }
  };

  const getUrgencyBadge = (urgency: "LOW" | "HIGH" | "MID" | null) => {
    if (!urgency) {
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-medium px-3 py-1 rounded-md min-w-[70px] justify-center">
          NOT SET
        </Badge>
      );
    }
    const colorMap = {
      LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      MID: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      HIGH: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };
    return (
      <Badge className={cn("font-medium px-3 py-1 rounded-md min-w-[70px] justify-center", colorMap[urgency])}>
        {urgency}
      </Badge>
    );
  };

  const getStatusBadge = (status: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null) => {
    if (!status) return null;
    const colorMap = {
      OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
      DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      REOPEN: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    };
    return (
      <Badge className={cn("font-medium px-3 py-1 rounded-md min-w-[80px] justify-center", colorMap[status])}>
        {status}
      </Badge>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-[200px] rounded-full" />
          <Skeleton className="h-9 w-[80px] rounded-full" />
          <Skeleton className="h-9 w-[80px] rounded-full" />
          <Skeleton className="h-9 w-[90px] rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="border rounded-lg overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-4">
          <Icons.warning className="h-12 w-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchTickets();
          }}
        >
          Retry
        </Button>
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
              <SelectItem value="MID">Medium</SelectItem>
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

        {/* Total Requests Info */}
        <div className="flex items-center justify-between gap-3 bg-muted dark:bg-muted/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Info className="h-4 w-4" />
            <span>
              {filteredItems.length} {filteredItems.length === 1 ? "request" : "requests"} found
            </span>
          </div>
          <CreateRequest />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-card hover:bg-card border-b">
              <TableHead className="font-bold text-foreground">Source</TableHead>
              <TableHead className="font-bold text-foreground">Title</TableHead>
              <TableHead className="font-bold text-foreground">Category</TableHead>
              <TableHead className="font-bold text-foreground">Created At</TableHead>
              <TableHead className="font-bold text-foreground">Priority</TableHead>
              <TableHead className="font-bold text-foreground">Status</TableHead>
              <TableHead className="font-bold text-foreground">Reviewed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("request_list_not_found")}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell className="font-medium">
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      item.type === "INTERNAL" 
                        ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300" 
                        : "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                    )}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">{item.title || "-"}</TableCell>
                  <TableCell>{item.category || "-"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getUrgencyBadge(item.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(item.workflowStatus)}</TableCell>
                  <TableCell>
                    {item.reviewed ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <Icons.checkCircle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        No
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Panel */}
      {isDetailPanelOpen && selectedRequest && (
        <ReviewDetailPanel
          review={selectedRequest}
          onClose={handleCloseDetailPanel}
          onNavigate={handleNavigateRequest}
        />
      )}
    </div>
  );
}
