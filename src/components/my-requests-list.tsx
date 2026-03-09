"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Info, ChevronDown, ArrowUpRight, Clock, User, Scale, FileText, CheckCircle2 } from "lucide-react";

import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";
import { getLocaleFromCookie } from "~/lib/locale";

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

import { getSessionAuthHeader } from "~/lib/api-auth";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

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
  const currentLocale = getLocaleFromCookie();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const userEmail = auth?.user?.email;
  const userId = auth?.user?.id;
  const authHeader = getSessionAuthHeader(auth);

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
            "Authorization": authHeader ?? "",
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
    return date.toLocaleDateString(currentLocale, { month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit", hour12: currentLocale === "en" });
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
          {t("retry")}
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
        <div className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-black dark:bg-white px-6 py-6 text-center transition-all hover:shadow-lg">
          <p className="text-2xl font-black text-white dark:text-black tracking-tight">
            {unresolvedCount}
          </p>
          <p className="text-sm font-medium text-white/60 dark:text-black/60 mt-1">
            {t("unresolved")} {unresolvedCount === 1 ? t("request_s") : t("requests_plural")}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-xs text-white/40 dark:text-black/40 font-medium uppercase tracking-wider">
              {t("awaiting_legal")}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-white/30 dark:text-black/30 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("requests_pending_legal_review")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-6 text-center transition-all hover:shadow-lg">
          <p className="text-2xl font-black text-black dark:text-white tracking-tight">
            {filteredItems.length}
          </p>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            {t("total")} {filteredItems.length === 1 ? t("request_s") : t("requests_plural")}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider">
              {requestItems.filter((i) => i.workflowStatus === "DONE").length} {t("completed_count")}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("total_and_completed_requests")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <Input
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Sort / Date */}
        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span>{t("date")}</span>
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
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-black dark:text-white data-[placeholder]:text-black dark:data-[placeholder]:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span>{t("category")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_categories")}</SelectItem>
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
          <SelectTrigger className="w-auto gap-1.5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-black dark:text-white data-[placeholder]:text-black dark:data-[placeholder]:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span>{t("status")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_status")}</SelectItem>
            <SelectItem value="OPEN">{t("status_open")}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t("status_in_progress")}</SelectItem>
            <SelectItem value="DONE">{t("status_done")}</SelectItem>
            <SelectItem value="OVERDUE">{t("status_overdue")}</SelectItem>
            <SelectItem value="REOPEN">{t("status_reopen")}</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors gap-1.5 h-auto"
            >
              {t("more_filters")}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "HIGH" ? "" : "HIGH" }))}>
              <span className={cn(selectedFilters.priority === "HIGH" && "font-bold")}>
                {t("high_priority")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "MID" ? "" : "MID" }))}>
              <span className={cn(selectedFilters.priority === "MID" && "font-bold")}>
                {t("medium_priority")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, priority: prev.priority === "LOW" ? "" : "LOW" }))}>
              <span className={cn(selectedFilters.priority === "LOW" && "font-bold")}>
                {t("low_priority")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, sourceType: prev.sourceType === "INTERNAL" ? "" : "INTERNAL" }))}>
              <span className={cn(selectedFilters.sourceType === "INTERNAL" && "font-bold")}>
                {t("internal_only")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilters(prev => ({ ...prev, sourceType: prev.sourceType === "EXTERNAL" ? "" : "EXTERNAL" }))}>
              <span className={cn(selectedFilters.sourceType === "EXTERNAL" && "font-bold")}>
                {t("external_only")}
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
            {t("clear_filters")}
          </Button>
        )}
      </div>
      </div>

      {/* Scrollable Request Cards — Overlapping Sticky Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ perspective: "1200px" }}>
      <div className="relative pt-2 pb-[200px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icons.tickets className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {t("request_list_not_found")}
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const priorityMap: Record<string, { label: string; dot: string }> = {
              HIGH: { label: t("high"), dot: "bg-white" },
              MID: { label: t("medium"), dot: "bg-neutral-400" },
              LOW: { label: t("low"), dot: "bg-neutral-600" },
            };
            const statusMap: Record<string, { label: string; classes: string }> = {
              OPEN: { label: t("status_open"), classes: "border-neutral-300 dark:border-neutral-600 text-black dark:text-white" },
              IN_PROGRESS: { label: t("status_in_progress"), classes: "border-neutral-300 dark:border-neutral-600 text-black dark:text-white" },
              DONE: { label: t("status_done"), classes: "border-neutral-300 dark:border-neutral-600 bg-black dark:bg-white text-white dark:text-black" },
              OVERDUE: { label: t("status_overdue"), classes: "border-neutral-300 dark:border-neutral-600 text-black dark:text-white" },
              REOPEN: { label: t("status_reopen"), classes: "border-neutral-300 dark:border-neutral-600 text-black dark:text-white" },
            };
            const priority = item.urgency ? priorityMap[item.urgency] : null;
            const status = item.workflowStatus ? statusMap[item.workflowStatus] : null;

            return (
              <div
                key={item.id}
                className="sticky mb-3 will-change-transform"
                style={{
                  top: `${index * 12}px`,
                  zIndex: index + 1,
                }}
              >
                <div
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-2xl",
                    "border-2 border-neutral-200 dark:border-neutral-700",
                    "bg-white dark:bg-neutral-900",
                    "shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.4)]",
                    "hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]",
                    "transition-all duration-500 ease-out",
                  )}
                  onClick={() => handleRowClick(item)}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="p-5 sm:p-6">
                    {/* Row 1: ID + Date/Time + Arrow */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center h-8 min-w-[56px] px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold tracking-wider">
                          #{item.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(item.createdAt)}</span>
                          <span className="text-neutral-300 dark:text-neutral-600">·</span>
                          <span>{formatTime(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                            {item.type}
                          </span>
                        )}
                        <ArrowUpRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Row 2: Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white leading-tight line-clamp-2 mb-1.5 group-hover:tracking-[-0.01em] transition-all duration-300">
                      {item.title || t("untitled_request")}
                    </h3>

                    {/* Row 3: Email */}
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-1">
                      {item.email}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-4" />

                    {/* Row 4: People + Meta */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Left: Legal + Reviewer */}
                      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
                          <span className="text-neutral-400 dark:text-neutral-500">{t("legal")}:</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.legalName || "—"}</span>
                        </div>
                        <div className="hidden sm:block h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
                          <span className="text-neutral-400 dark:text-neutral-500">{t("reviewer")}:</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.reviewerName || "—"}</span>
                        </div>
                      </div>

                      {/* Right: Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.category && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1">
                            <FileText className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                            {item.category}
                          </span>
                        )}
                        {priority && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1">
                            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
                            {priority.label}
                          </span>
                        )}
                        {status && (
                          <span className={cn(
                            "inline-flex items-center text-[11px] font-semibold rounded-lg px-2.5 py-1 border",
                            status.classes,
                          )}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* End of list indicator */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 animate-ping-slow" />
              <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-black dark:bg-white">
                <CheckCircle2 className="h-6 w-6 text-white dark:text-black animate-bounce-gentle" />
              </div>
            </div>
            <p className="text-sm font-semibold text-black dark:text-white mb-0.5 animate-fade-in-up-delay-1">
              {t("end_of_results")}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 animate-fade-in-up-delay-2">
              {filteredItems.length} {filteredItems.length === 1 ? t("request_s") : t("requests_plural")} {t("displayed")}
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Detail Panel */}
      {isDetailPanelOpen && selectedRequest && (
        <ReviewDetailPanel
          review={selectedRequest}
          onClose={handleCloseDetailPanel}
          onNavigate={handleNavigateRequest}
          hideReply={true}
        />
      )}
    </div>
  );
}
