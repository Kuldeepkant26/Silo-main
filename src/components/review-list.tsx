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
import { Checkbox } from "./ui/checkbox";
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
import { ReviewBulkEditModal } from "./review-bulk-edit-modal";
import { ReviewEditModal } from "./review-edit-modal";

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
  createdAt: string;
  updatedAt: string | null;
  sourceType: "EXTERNAL" | "INTERNAL";
  category: Category | null;
  requestForm: RequestForm | null;
}

interface Reviewer {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

// Review item for display
interface ReviewItem {
  id: string;
  type: string; // sourceType (EXTERNAL/INTERNAL)
  title: string; // requestForm.name
  email: string;
  createdAt: string;
  urgency: "LOW" | "HIGH" | "MID" | null;
  workflowStatus: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null;
  category: string | null;
}

type SortOrder = "newest" | "oldest";

export function ReviewList() {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const userEmail = auth?.user?.email;

  // State for API data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReviewerId, setCurrentReviewerId] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedFilters, setSelectedFilters] = useState<{
    period: string;
    priority: string;
    category: string;
    team: string;
  }>({
    period: "",
    priority: "",
    category: "",
    team: "",
  });
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState<string | null>(null);

  // Fetch reviewers to find current user's reviewer ID
  const fetchReviewers = useCallback(async () => {
    if (!organizationId) {
      console.log("No organizationId available");
      setLoading(false);
      setError("No organization selected");
      return;
    }
    
    console.log("Fetching reviewers for org:", organizationId, "user email:", userEmail);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/form/reviewers/${organizationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      
      console.log("Reviewers response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Reviewers data:", data);
        const reviewersList = data.reviewers || [];
        
        // Find current user's reviewer ID by matching email
        if (userEmail) {
          const currentUser = reviewersList.find(
            (r: Reviewer) => r.email.toLowerCase() === userEmail.toLowerCase()
          );
          if (currentUser) {
            console.log("Found reviewer:", currentUser);
            setCurrentReviewerId(currentUser.id);
          } else {
            console.log("Current user not found in reviewers list");
            setLoading(false);
            setError("You are not assigned as a reviewer");
          }
        } else {
          setLoading(false);
          setError("No user email found");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch reviewers:", errorText);
        setLoading(false);
        setError("Failed to load reviewers");
      }
    } catch (error) {
      console.error("Error fetching reviewers:", error);
      setLoading(false);
      setError("Error connecting to server");
    }
  }, [organizationId, userEmail]);

  // Fetch all tickets for review
  const fetchTickets = useCallback(async () => {
    if (!currentReviewerId) return;
    
    setLoading(true);
    setError(null);
    
    console.log("Fetching tickets for reviewer:", currentReviewerId);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/get-all-requests/${currentReviewerId}/false`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      
      console.log("Tickets response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Tickets data:", data);
        setTickets(data.tickets || []);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch tickets:", errorText);
        setError("Failed to load tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [currentReviewerId]);

  // Initial data fetch - get reviewers first
  useEffect(() => {
    if (organizationId && userEmail) {
      fetchReviewers();
    }
  }, [organizationId, userEmail, fetchReviewers]);

  // Fetch tickets after we have the reviewer ID
  useEffect(() => {
    if (currentReviewerId) {
      fetchTickets();
    }
  }, [currentReviewerId, fetchTickets]);

  // Transform tickets to ReviewItem format for table display
  const reviewItems: ReviewItem[] = useMemo(() => {
    return tickets.map((ticket) => ({
      id: String(ticket.id),
      type: ticket.sourceType || "INTERNAL",
      // For INTERNAL tickets, use summary; for EXTERNAL, use requestForm.name
      title: ticket.sourceType === "INTERNAL" 
        ? (ticket.summary || "") 
        : (ticket.requestForm?.name || ""),
      email: ticket.email || "",
      createdAt: ticket.createdAt,
      urgency: ticket.priority,
      workflowStatus: ticket.workflowStatus,
      category: ticket.category?.name || null,
    }));
  }, [tickets]);

  const pendingCount = tickets.length;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...reviewItems];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.type.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (selectedFilters.priority) {
      items = items.filter((item) => item.urgency === selectedFilters.priority);
    }

    // Apply category filter
    if (selectedFilters.category) {
      items = items.filter((item) => item.category === selectedFilters.category);
    }

    return items;
  }, [reviewItems, searchQuery, selectedFilters]);

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRowClick = (item: ReviewItem) => {
    setSelectedReview(item);
    setIsDetailPanelOpen(true);
  };

  const handleEditClick = (item: ReviewItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditReviewId(item.id);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the tickets list after successful edit
    fetchTickets();
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedReview(null);
  };

  const handleNavigateReview = (direction: "prev" | "next") => {
    if (!selectedReview) return;
    const currentIndex = filteredItems.findIndex(
      (item) => item.id === selectedReview.id
    );
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredItems.length) {
      setSelectedReview(filteredItems[newIndex]!);
    }
  };

  const getUrgencyBadge = (urgency: "LOW" | "HIGH" | "MID" | null) => {
    if (!urgency) {
      return (
        <Badge className="bg-gray-400 text-white font-medium px-3 py-1 rounded">
          NOT SET
        </Badge>
      );
    }
    const colorMap = {
      LOW: "bg-[#2e7d32]",
      MID: "bg-[#f9a825]",
      HIGH: "bg-[#d32f2f]",
    };
    return (
      <Badge className={cn("text-white font-medium px-3 py-1 rounded", colorMap[urgency])}>
        {urgency}
      </Badge>
    );
  };

  const getStatusBadge = (status: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null) => {
    if (!status) return null;
    const colorMap = {
      OPEN: "bg-[#2196f3]",
      IN_PROGRESS: "bg-[#ff9800]",
      DONE: "bg-[#4caf50]",
      OVERDUE: "bg-[#f44336]",
      REOPEN: "bg-[#9c27b0]",
    };
    return (
      <Badge className={cn("text-white font-medium px-3 py-1 rounded", colorMap[status])}>
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
              <Skeleton className="h-4 w-4" />
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
            fetchReviewers();
          }}
        >
          {t("retry") || "Retry"}
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
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Icons.arrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pending Requests Banner */}
        <div className="flex items-center gap-3 bg-[#e8e8e8] rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#333]">
            <Info className="h-4 w-4" />
            <span>
              {pendingCount} {t("requests_pending_to_be_reviewed")}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white border-b">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-bold text-[#333]">{t("type")}</TableHead>
              <TableHead className="font-bold text-[#333]">Title</TableHead>
              <TableHead className="font-bold text-[#333]">Email</TableHead>
              <TableHead className="font-bold text-[#333]">Created At</TableHead>
              <TableHead className="font-bold text-[#333]">{t("urgency")}</TableHead>
              <TableHead className="font-bold text-[#333]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("review_list_not_found")}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleEditClick(item, e)}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getUrgencyBadge(item.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(item.workflowStatus)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Panel */}
      {isDetailPanelOpen && selectedReview && (
        <ReviewDetailPanel
          review={selectedReview}
          onClose={handleCloseDetailPanel}
          onNavigate={handleNavigateReview}
        />
      )}

      {/* Edit Modal */}
      {editReviewId && (
        <ReviewEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          reviewId={editReviewId}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Bulk Edit Modal */}
      <ReviewBulkEditModal
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        selectedCount={selectedItems.length}
      />
    </div>
  );
}
