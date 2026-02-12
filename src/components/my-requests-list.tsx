"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Info, ChevronDown } from "lucide-react";

import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";

import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

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
  reviewerId: string | null;
  legalName: string | null;
  reviewerName: string | null;
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
  legalName: string | null;
  reviewerName: string | null;
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
      legalName: ticket.legalName || null,
      reviewerName: ticket.reviewerName || null,
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

  // Compute summary stats
  const unresolvedCount = useMemo(() => {
    return requestItems.filter(
      (item) => item.workflowStatus !== "DONE"
    ).length;
  }, [requestItems]);

  // Date formatting helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
    <div className="w-full flex flex-col min-h-0 flex-1">
      {/* Sticky upper section */}
      <div className="shrink-0 space-y-4 pb-4">
        {/* Header with Add Request */}
        <div className="flex items-center justify-end">
          <CreateRequest />
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border-2 border-foreground/15 rounded-xl px-6 py-5 bg-card text-center">
          <p className="text-lg font-semibold text-foreground">
            {unresolvedCount} Unresolved {unresolvedCount === 1 ? "request" : "requests"}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Awaiting legal
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Requests pending legal review</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="border-2 border-foreground/15 rounded-xl px-6 py-5 bg-card text-center">
          <p className="text-lg font-semibold text-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "request" : "requests"} total
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground font-medium">
              {requestItems.filter((i) => i.workflowStatus === "DONE").length} completed
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total and completed requests</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 border-foreground/15 bg-card focus-visible:ring-foreground/20"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Sort / Date */}
        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-foreground/20 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <span>Date</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("newest_first")}</SelectItem>
            <SelectItem value="oldest">{t("oldest_first")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select 
          value={selectedFilters.category} 
          onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}
        >
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-foreground/20 bg-card px-4 py-2 text-sm font-medium text-foreground data-[placeholder]:text-foreground hover:bg-muted transition-colors">
            <span>Category</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select 
          value={selectedFilters.status} 
          onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
        >
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-foreground/20 bg-card px-4 py-2 text-sm font-medium text-foreground data-[placeholder]:text-foreground hover:bg-muted transition-colors">
            <span>Status</span>
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

        {/* More Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full border-2 border-foreground/20 bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors gap-1.5 h-auto"
            >
              More filters
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "HIGH" ? "" : "HIGH" }))}>
              <span className={cn(selectedFilters.priority === "HIGH" && "font-bold")}>
                High Priority
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "MID" ? "" : "MID" }))}>
              <span className={cn(selectedFilters.priority === "MID" && "font-bold")}>
                Medium Priority
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "LOW" ? "" : "LOW" }))}>
              <span className={cn(selectedFilters.priority === "LOW" && "font-bold")}>
                Low Priority
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, sourceType: prev.sourceType === "INTERNAL" ? "" : "INTERNAL" }))}>
              <span className={cn(selectedFilters.sourceType === "INTERNAL" && "font-bold")}>
                Internal Only
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, sourceType: prev.sourceType === "EXTERNAL" ? "" : "EXTERNAL" }))}>
              <span className={cn(selectedFilters.sourceType === "EXTERNAL" && "font-bold")}>
                External Only
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filters Clear */}
        {(selectedFilters.priority || selectedFilters.status || selectedFilters.category || selectedFilters.sourceType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFilters({ priority: "", status: "", category: "", sourceType: "" })}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <Icons.close className="h-3.5 w-3.5 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      </div>

      {/* Scrollable Request Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
      <div className="space-y-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icons.tickets className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {t("request_list_not_found")}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer rounded-xl border border-transparent hover:border-foreground/10 hover:bg-muted/50 transition-all px-4 py-4"
              onClick={() => handleRowClick(item)}
            >
              {/* Date row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">
                  {formatDate(item.createdAt)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatTime(item.createdAt)}
                </span>
              </div>

              {/* Title row */}
              <div className="flex items-start gap-2.5 mb-1.5">
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-md border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 text-xs font-semibold px-2 py-0.5"
                >
                  ID: {item.id}
                </Badge>
                <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-1">
                  {item.title || "Untitled request"}
                </h3>
              </div>

              {/* Description / email */}
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2 pl-0">
                {item.email}
              </p>

              {/* Legal and Reviewer info */}
              <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                <span>
                  Legal: <span className="font-medium">{item.legalName || "Not set"}</span>
                </span>
                <span>•</span>
                <span>
                  Reviewer: <span className="font-medium">{item.reviewerName || "Not set"}</span>
                </span>
              </div>

              {/* Footer: category + status badges */}
              <div className="flex items-center gap-3 flex-wrap">
                {item.category && (
                  <span className="text-xs text-muted-foreground italic">
                    Category: {item.category}
                  </span>
                )}
                {item.urgency && (
                  <Badge className={cn(
                    "text-xs font-medium px-2 py-0 rounded-md",
                    item.urgency === "HIGH" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                    item.urgency === "MID" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    item.urgency === "LOW" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                  )}>
                    {item.urgency}
                  </Badge>
                )}
                {item.workflowStatus && (
                  <Badge className={cn(
                    "text-xs font-medium px-2 py-0 rounded-md",
                    item.workflowStatus === "OPEN" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    item.workflowStatus === "IN_PROGRESS" && "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
                    item.workflowStatus === "DONE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                    item.workflowStatus === "OVERDUE" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                    item.workflowStatus === "REOPEN" && "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                  )}>
                    {item.workflowStatus.replace("_", " ")}
                  </Badge>
                )}
              </div>

              {/* Separator between cards */}
              <div className="mt-4 border-b border-foreground/5 group-last:border-0" />
            </div>
          ))
        )}
      </div>
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
