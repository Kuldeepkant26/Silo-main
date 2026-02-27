"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "~/server/auth/client";
import { api } from "~/trpc/react";
import { env } from "~/env";

import { getSessionAuthHeader } from "~/lib/api-auth";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

export function CategoryModal({ isOpen, onClose, onCategoryCreated }: CategoryModalProps) {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const authHeader = getSessionAuthHeader(auth);
  
  // Fetch teams using tRPC (same as Teams tab)
  const { data: teams, isLoading: teamsLoading } = api.team.getAllByOrganization.useQuery(
    undefined,
    { enabled: isOpen }
  );
     
  const [name, setName] = useState("");
  const [assignedTeamId, setAssignedTeamId] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Thank you for submitting your request. Our legal team will review your case and get back to you shortly."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || !organizationId) return;

    setIsLoading(true);
    setError("");
         
    try {
      const response = await fetch(`${API_BASE_URL}/api/internal/create-category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader ?? "",
        },
        body: JSON.stringify({
          name: name.trim(),
          organizationId,
          assignedTeamId: assignedTeamId || null,
          autoReplyEnabled,
          autoReplyMessage: autoReplyEnabled ? autoReplyMessage : "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      // Reset form and close modal
      setName("");
      setAssignedTeamId("");
      setAutoReplyEnabled(false);
      setAutoReplyMessage("Thank you for submitting your request. Our legal team will review your case and get back to you shortly.");
      onClose();
      
      // Trigger refresh of categories list
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (err) {
      setError(t("failed_create_category"));
      console.error("Error creating category:", err);
    } finally {
      setIsLoading(false);
    }
  };
    
  const handleCancel = () => {
    setName("");
    setAssignedTeamId("");
    setAutoReplyEnabled(false);
    setAutoReplyMessage("Thank you for submitting your request. Our legal team will review your case and get back to you shortly.");
    setError("");
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="bg-card rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-[520px] w-[90%] m-5 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
        <div className="p-12 pb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-3 leading-tight tracking-tight">
            {t("create_new_category")}
          </h2>
          
          <p className="text-base text-muted-foreground mb-7 font-normal leading-relaxed">
            {t("create_category_description")}
          </p>

          {/* Category Name Input */}
          <div className="mb-5">
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t("category_name")}
            </label>
            <input
              type="text"
              className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 font-[system-ui] bg-background placeholder:text-muted-foreground hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)]"
              placeholder={t("category_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Assigned Team Dropdown */}
          <div className="mb-5">
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t("assign_to_team_optional")}
            </label>
            <div className="relative">
              <select
                className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 font-[system-ui] bg-background cursor-pointer appearance-none pr-10 hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                value={assignedTeamId}
                onChange={(e) => setAssignedTeamId(e.target.value)}
                disabled={teamsLoading}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                <option value="">{t("available_to_everyone")}</option>
                {(teams ?? []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {teamsLoading && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
            {t("categories_help_text")}
          </p>

          {/* Auto Reply Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-sm font-medium text-foreground">{t("enable_auto_reply")}</span>
            <button
              type="button"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                autoReplyEnabled ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform duration-200 ${
                  autoReplyEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
                                                 
          {/* Auto Reply Message Input */}
          {autoReplyEnabled && (
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t("auto_reply_message")}
              </label>
              <textarea
                className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 font-[system-ui] bg-background placeholder:text-muted-foreground hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] resize-none min-h-[100px]"
                placeholder={t("auto_reply_placeholder")}
                value={autoReplyMessage}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}

          <div className="flex gap-3 justify-center items-center mt-6">
            <button
              className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-border bg-transparent text-foreground uppercase hover:bg-muted hover:border-muted-foreground active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t("cancel").toUpperCase()}
            </button>
            <button
              className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-primary bg-primary text-primary-foreground uppercase hover:bg-primary/90 hover:border-primary/90 active:bg-primary active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? t("saving") : t("save").toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}