"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronUp, ChevronDown, Settings, Info, Send } from "lucide-react";

import { createClient } from "@supabase/supabase-js";
import { cn } from "~/lib/utils";
import { env } from "~/env";
import { authClient } from "~/server/auth/client";

// Initialize Supabase client for signed URLs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

interface ReviewDetailPanelProps {
  review: {
    id: string;
    type: string;
    title: string;
    email: string;
    createdAt: string;
    urgency: "LOW" | "HIGH" | "MID" | null;
  };
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

interface DetailedReview {
  id: number;
  workflowStatus: "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN" | null;
  priority: "HIGH" | "MID" | "LOW" | null;
  assignedTeamId: string | null;
  legalOwnerId: string | null;
  description: string | null;
  payload: {
    attachments?: Array<{
      Key: string;
      Id: string;
    }>;
  };
  created_at: string;
}

interface ChatMessage {
  id: number;
  message: string;
  attachments: string[];
  senderType: "ADMIN" | "USER";
  createdAt: string;
}

export function ReviewDetailPanel({
  review,
  onClose,
  onNavigate,
}: ReviewDetailPanelProps) {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const userId = auth?.user?.id;
  const userEmail = auth?.user?.email;
  
  const [activeTab, setActiveTab] = useState<"details" | "chat">(
    "details"
  );
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [detailedReview, setDetailedReview] = useState<DetailedReview | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed review data
  useEffect(() => {
    const fetchReviewDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/get-ticket-detail/${review.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": AUTH_TOKEN,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // API returns { tickets: [...] }
          if (data.tickets && data.tickets.length > 0) {
            setDetailedReview(data.tickets[0]);
          } else {
            setError("No ticket details found");
          }
        } else {
          setError("Failed to load review details");
        }
      } catch (error) {
        console.error("Error fetching review details:", error);
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewDetails();
  }, [review.id]);

  // Fetch attachment URLs from Supabase using signed URLs
  useEffect(() => {
    const fetchAttachmentUrls = async () => {
      if (!detailedReview?.payload?.attachments?.length) {
        setAttachmentUrls([]);
        return;
      }

      const urls: string[] = [];
      for (const attachment of detailedReview.payload.attachments) {
        const key = attachment.Key;
        // Extract file path from key (remove bucket prefix if present)
        const filePath = key.startsWith("ticket-attachments/")
          ? key.replace("ticket-attachments/", "")
          : key;
        
        // Create signed URL that works for private buckets
        const { data, error } = await supabase.storage
          .from("ticket-attachments")
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          console.log("Signed URL:", data.signedUrl);
          urls.push(data.signedUrl);
        } else {
          console.error("Failed to get signed URL:", error);
        }
      }
      setAttachmentUrls(urls);
    };

    fetchAttachmentUrls();
  }, [detailedReview]);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if ((!userId && !userEmail) || activeTab !== "chat") return;
      
      setLoadingMessages(true);
      try {
        // Internal users (with userId) send user_id, external users send email
        const queryParam = userId 
          ? `user_id=${userId}` 
          : `email=${userEmail}`;
        
        const response = await fetch(
          `${API_BASE_URL}/api/ticket-message/${review.id}?${queryParam}`,
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
          setMessages(data.messages || data || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [review.id, userId, userEmail, activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !userEmail) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ticket-message/${review.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
          body: JSON.stringify({
            user_id: userId,
            email: userEmail,
            message: newMessage,
            attachments: [],
          }),
        }
      );
      
      if (response.ok) {
        // Add message to local state immediately
        const tempMessage: ChatMessage = {
          id: Date.now(),
          message: newMessage,
          attachments: [],
          senderType: "ADMIN",
          createdAt: new Date().toISOString(),
        };
        setMessages([...messages, tempMessage]);
        setNewMessage("");
        
        // Optionally refetch to get server data
        // You can uncomment this if you want to sync with server
        // setTimeout(() => fetchMessages(), 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4">
          <button
            className={cn(
              "text-sm font-medium pb-1",
              activeTab === "details"
                ? "text-[#1a1a1a] border-b-2 border-[#1a1a1a]"
                : "text-muted-foreground"
            )}
            onClick={() => setActiveTab("details")}
          >
            {t("details")}
          </button>
          <button
            className={cn(
              "text-sm font-medium pb-1",
              activeTab === "chat"
                ? "text-[#1a1a1a] border-b-2 border-[#1a1a1a]"
                : "text-muted-foreground"
            )}
            onClick={() => setActiveTab("chat")}
          >
            {t("chat")}
          </button>
        </div>
                
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
                                                     
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : activeTab === "details" && detailedReview ? (
          <div className="space-y-6">
            {/* Attachments - at the top */}
            {detailedReview.payload?.attachments && detailedReview.payload.attachments.length > 0 && (
              <div>
                <div className="bg-[#f5f5f5] rounded-lg p-4">
                  {attachmentUrls.length > 0 ? (
                    <div className="space-y-3">
                      {attachmentUrls.map((url, index) => {
                        const fileName = detailedReview.payload?.attachments?.[index]?.Key.split('/').pop() || 'attachment';
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                        
                        return (
                          <div key={index} className="bg-white rounded border overflow-hidden">
                            {isImage ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={url}
                                  alt={fileName}
                                  className="w-full h-40 object-contain bg-gray-50"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden p-4 text-center text-sm text-muted-foreground">
                                  Failed to load image
                                </div>
                              </a>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-20 hover:bg-gray-50 transition-colors"
                              >
                                <p className="text-sm font-medium text-blue-600 underline">
                                  {fileName}
                                </p>
                              </a>
                            )}
                            <div className="px-3 py-2 border-t bg-gray-50">
                              <p className="text-xs text-muted-foreground truncate">{fileName}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Loading attachments...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ID and Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">ID: {detailedReview.id}</span>
                {detailedReview.workflowStatus && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded text-xs",
                      detailedReview.workflowStatus === "OPEN" && "border-blue-500 text-blue-500",
                      detailedReview.workflowStatus === "DONE" && "border-green-500 text-green-500",
                      detailedReview.workflowStatus === "OVERDUE" && "border-red-500 text-red-500",
                      detailedReview.workflowStatus === "REOPEN" && "border-orange-500 text-orange-500"
                    )}
                  >
                    {detailedReview.workflowStatus}
                  </Badge>
                )}
                {detailedReview.priority && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded text-xs",
                      detailedReview.priority === "HIGH" && "border-red-500 text-red-500",
                      detailedReview.priority === "MID" && "border-yellow-500 text-yellow-500",
                      detailedReview.priority === "LOW" && "border-green-500 text-green-500"
                    )}
                  >
                    {detailedReview.priority}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(detailedReview.created_at).toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* Description */}
            {detailedReview.description && (
              <div>
                <label className="text-sm font-medium text-[#1a1a1a] block mb-2">
                  Description
                </label>
                <p className="text-sm text-[#333] whitespace-pre-wrap">
                  {detailedReview.description}
                </p>
              </div>
            )}

            {/* Legal Owner */}
            {detailedReview.legalOwnerId && (
              <div>
                <label className="text-sm font-medium text-[#1a1a1a] block mb-2">
                  Legal Owner
                </label>
                <p className="text-sm text-[#333]">{detailedReview.legalOwnerId}</p>
              </div>
            )}

            {/* Assigned Team */}
            {detailedReview.assignedTeamId && (
              <div>
                <label className="text-sm font-medium text-[#1a1a1a] block mb-2">
                  Assigned Team
                </label>
                <Badge className="bg-[#2e7d32] text-white rounded px-3">
                  {detailedReview.assignedTeamId}
                </Badge>
              </div>
            )}
          </div>
        ) : activeTab === "chat" ? (
          <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white rounded-xl">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              {loadingMessages ? (
                <div className="space-y-4 px-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "rounded-2xl p-4 animate-pulse",
                        i % 2 === 0 ? "bg-gray-200 w-2/3" : "bg-gray-100 w-3/4"
                      )}>
                        <div className="h-3 bg-gray-300 rounded w-16 mb-2" />
                        <div className="h-4 bg-gray-300 rounded w-full mb-1" />
                        <div className="h-4 bg-gray-300 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-inner">
                    <Send className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
                </div>
              ) : (
                <div className="space-y-3 px-1">
                  {messages.map((msg, index) => {
                    const isAdmin = msg.senderType === "ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                          isAdmin ? "items-end" : "items-start"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Sender Badge */}
                        <div className={cn(
                          "flex items-center gap-1.5 mb-1.5 px-1",
                          isAdmin ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                            isAdmin 
                              ? "bg-gradient-to-br from-[#1a1a1a] to-[#333] text-white" 
                              : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          )}>
                            {isAdmin ? "A" : "U"}
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold tracking-wide uppercase",
                            isAdmin ? "text-gray-600" : "text-blue-600"
                          )}>
                            {msg.senderType}
                          </span>
                        </div>
                        
                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md",
                            isAdmin
                              ? "bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white rounded-tr-sm"
                              : "bg-white border border-gray-100 text-[#1a1a1a] rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          )}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <p className={cn(
                            "text-[10px] mt-2 flex items-center gap-1",
                            isAdmin ? "text-white/50" : "text-gray-400"
                          )}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t bg-white/80 backdrop-blur-sm">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="pr-4 py-6 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all duration-200 placeholder:text-gray-400"
                    disabled={sendingMessage}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-2xl transition-all duration-300 shadow-lg",
                    newMessage.trim() 
                      ? "bg-gradient-to-br from-[#1a1a1a] to-[#333] hover:from-[#333] hover:to-[#444] hover:scale-105 hover:shadow-xl" 
                      : "bg-gray-200 shadow-none"
                  )}
                >
                  <Send className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    sendingMessage && "animate-pulse",
                    newMessage.trim() && "translate-x-0.5 -translate-y-0.5"
                  )} />
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
