"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

interface ReviewEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  onSuccess?: () => void;
}

interface LegalOwner {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

export function ReviewEditModal({
  open,
  onOpenChange,
  reviewId,
  onSuccess,
}: ReviewEditModalProps) {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;

  const [legalOwners, setLegalOwners] = useState<LegalOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [legalOwnerId, setLegalOwnerId] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [workflowStatus, setWorkflowStatus] = useState<string>("");

  // Initial values to track changes
  const [initialValues, setInitialValues] = useState<{
    legalOwnerId: string;
    priority: string;
    workflowStatus: string;
  }>({
    legalOwnerId: "",
    priority: "",
    workflowStatus: "",
  });

  // Fetch legal owners
  useEffect(() => {
    const fetchLegalOwners = async () => {
      if (!organizationId || !open) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/internal/get-legal-owners/${organizationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": AUTH_TOKEN,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log("Legal owners response:", data);
          // API returns { users: [...] }
          const owners = data.users || data.legalOwners || data.owners || data.data || data;
          setLegalOwners(Array.isArray(owners) ? owners : []);
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch legal owners:", response.status, errorText);
        }
      } catch (error) {
        console.error("Error fetching legal owners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLegalOwners();
  }, [organizationId, open]);

  // Fetch current review details
  useEffect(() => {
    const fetchReviewDetails = async () => {
      if (!open || !reviewId) return;
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/internal/review-details/${reviewId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": AUTH_TOKEN,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log("Review details response:", data);
          if (data.tickets && data.tickets.length > 0) {
            const ticket = data.tickets[0];
            const initialLegalOwnerId = ticket.legalOwnerId || "";
            const initialPriority = ticket.priority || "";
            const initialWorkflowStatus = ticket.workflowStatus || "";
            
            setLegalOwnerId(initialLegalOwnerId);
            setPriority(initialPriority);
            setWorkflowStatus(initialWorkflowStatus);
            
            // Store initial values
            setInitialValues({
              legalOwnerId: initialLegalOwnerId,
              priority: initialPriority,
              workflowStatus: initialWorkflowStatus,
            });
          }
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch review details:", response.status, errorText);
        }
      } catch (error) {
        console.error("Error fetching review details:", error);
      }
    };

    fetchReviewDetails();
  }, [open, reviewId]);

  const handleSave = async () => {
    if (!organizationId) return;
    
    // Build payload with only changed fields
    const payload: Record<string, string> = {
      organizationId,
    };
    
    if (legalOwnerId !== initialValues.legalOwnerId) {
      payload.legalOwnerId = legalOwnerId;
    }
    if (priority !== initialValues.priority) {
      payload.priority = priority;
    }
    if (workflowStatus !== initialValues.workflowStatus) {
      payload.workflowStatus = workflowStatus;
    }
    
    console.log("Saving with payload:", payload);
    
    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/review-ticket/${reviewId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (response.ok) {
        onSuccess?.();
        onOpenChange(false);
      } else {
        const errorText = await response.text();
        console.error("Failed to update review:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error updating review:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Legal Owner */}
          <div>
            <label className="text-lg font-bold text-[#1a1a1a] block mb-3">
              {t("legal_owner")}
            </label>
            <Select value={legalOwnerId} onValueChange={setLegalOwnerId} disabled={legalOwners.length === 0}>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder={legalOwners.length === 0 ? "No legal owners" : t("select_owner")} />
              </SelectTrigger>
              <SelectContent>
                {legalOwners.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No legal owners available
                  </div>
                ) : (
                  legalOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={owner.image || ""} />
                          <AvatarFallback className="text-xs">
                            {owner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{owner.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Change Priority */}
          <div>
            <label className="text-lg font-bold text-[#1a1a1a] block mb-3">
              Change priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder="HIGH , MID , LOW" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="MID">MID</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-lg font-bold text-[#1a1a1a] block mb-3">
              Status
            </label>
            <Select value={workflowStatus} onValueChange={setWorkflowStatus}>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder="DONE, OVERDUE, REOPEN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
                <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                <SelectItem value="REOPEN">REOPEN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full rounded-full bg-[#1a1a1a] text-white py-6 text-sm font-bold hover:bg-[#333]"
          >
            {saving ? "Saving..." : "SAVE"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
