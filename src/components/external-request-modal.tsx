"use client";

import { useState } from "react";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

interface ExternalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormCreated?: () => void;
}

export function ExternalRequestModal({ isOpen, onClose, onFormCreated }: ExternalRequestModalProps) {
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  
  const [title, setTitle] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Thank you for submitting your request. Our team will review your case and get back to you shortly."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim() || !organizationId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/createForm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": AUTH_TOKEN,
        },
        body: JSON.stringify({
          name: title,
          tags: ["external"],
          autoReplyEnabled,
          autoReplyMessage: autoReplyEnabled ? autoReplyMessage : "",
          organization: organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create form");
      }

      // Reset form and close modal
      setTitle("");
      setAutoReplyEnabled(false);
      setAutoReplyMessage("Thank you for submitting your request. Our team will review your case and get back to you shortly.");
      onClose();
      
      // Trigger refresh of forms list
      if (onFormCreated) {
        onFormCreated();
      }
    } catch (err) {
      setError("Failed to create request form. Please try again.");
      console.error("Error creating form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setAutoReplyEnabled(false);
    setAutoReplyMessage("Thank you for submitting your request. Our team will review your case and get back to you shortly.");
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
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-[520px] w-[90%] m-5 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
        <div className="p-12 pb-12">
          <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-3 leading-tight tracking-tight">
            Create a new external request form
          </h2>
          
          <p className="text-base text-[#666] mb-7 font-normal leading-relaxed">
            Please create a title for your request
          </p>

          <input
            type="text"
            className="w-full px-[18px] py-4 text-[15px] text-[#1a1a1a] border-[1.5px] border-[#d1d5db] rounded-[10px] outline-none transition-all duration-200 font-[system-ui] bg-white placeholder:text-[#9ca3af] hover:border-[#a8aeb8] focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.08)]"
            placeholder="Lost baggage flight 345"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <p className="text-sm text-[#6b7280] leading-relaxed mt-6 mb-6">
            External requests are submitted by external users who need to open a request, such as a reclaim.
          </p>

          {/* Auto Reply Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[#e5e7eb]">
            <span className="text-sm font-medium text-[#1a1a1a]">Enable Auto Reply</span>
            <button
              type="button"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                autoReplyEnabled ? "bg-[#1a1a1a]" : "bg-[#d1d5db]"
              }`}
              onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  autoReplyEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Auto Reply Message Input */}
          {autoReplyEnabled && (
            <div className="mt-4">
              <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">
                Auto Reply Message
              </label>
              <textarea
                className="w-full px-[18px] py-4 text-[15px] text-[#1a1a1a] border-[1.5px] border-[#d1d5db] rounded-[10px] outline-none transition-all duration-200 font-[system-ui] bg-white placeholder:text-[#9ca3af] hover:border-[#a8aeb8] focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.08)] resize-none min-h-[100px]"
                placeholder="Enter the auto-reply message..."
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
              className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-[#d1d5db] bg-transparent text-[#1a1a1a] uppercase hover:bg-[#f9fafb] hover:border-[#9ca3af] active:bg-[#f3f4f6] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCancel}
              disabled={isLoading}
            >
              CANCEL
            </button>
            <button
              className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-[#1a1a1a] bg-[#1a1a1a] text-white uppercase hover:bg-[#333] hover:border-[#333] active:bg-[#1a1a1a] active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={!title.trim() || isLoading}
            >
              {isLoading ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
