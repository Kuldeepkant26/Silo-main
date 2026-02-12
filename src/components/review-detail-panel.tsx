"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronUp, ChevronDown, Settings, Info, Send, RefreshCw, Sparkles, Wand2, Paperclip, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from "~/lib/validators/request";

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

interface ChatAttachment {
  Key: string;
  Id: string;
}

interface ChatMessage {
  id: number;
  message: string;
  attachments: ChatAttachment[] | string[];
  senderType: string;
  senderEmail: string;
  createdAt: string;
}

interface ChatUploadedFile {
  file: File;
  key: string;
  id: string;
  uploaded: boolean;
  error?: string;
}

// Component to render a chat attachment with signed URL
function ChatAttachmentPreview({ attKey, fileName, isImage, isCurrentUser }: {
  attKey: string;
  fileName: string;
  isImage: boolean;
  isCurrentUser: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      const filePath = attKey.startsWith("ticket-attachments/")
        ? attKey.replace("ticket-attachments/", "")
        : attKey;
      const { data } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
      setLoading(false);
    };
    fetchUrl();
  }, [attKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1 text-[11px] opacity-60">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading attachment...</span>
      </div>
    );
  }

  if (!url) return null;

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-border/30 mt-1">
        <img
          src={url}
          alt={fileName}
          className="max-w-full max-h-48 object-contain bg-muted/30 rounded-lg"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 mt-1 text-xs font-medium transition-colors border",
        isCurrentUser
          ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
          : "bg-muted/50 border-border hover:bg-muted text-foreground"
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[160px]">{fileName}</span>
    </a>
  );
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
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [enhancedVersions, setEnhancedVersions] = useState<string[]>([]);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Chat attachment state
  const [chatAttachments, setChatAttachments] = useState<ChatUploadedFile[]>([]);
  const [chatUploading, setChatUploading] = useState(false);
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

  // Scroll to bottom when messages change - use auto for instant scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages]);

  // Handle chat file upload
  const handleChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (chatAttachments.length + files.length > MAX_FILES_COUNT) {
      return;
    }

    setChatUploading(true);
    const newUploads: ChatUploadedFile[] = [];
    const tempFolderTimestamp = Date.now();

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        newUploads.push({ file, key: "", id: crypto.randomUUID(), uploaded: false, error: `File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` });
        continue;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        newUploads.push({ file, key: "", id: crypto.randomUUID(), uploaded: false, error: "Unsupported file type" });
        continue;
      }

      const fileId = crypto.randomUUID();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `chat_${tempFolderTimestamp}/${timestamp}_${randomString}.${sanitizedFileName.split('.').pop()}`;

      try {
        const { data, error: uploadErr } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          newUploads.push({ file, key: "", id: fileId, uploaded: false, error: uploadErr.message });
        } else {
          newUploads.push({ file, key: `ticket-attachments/${data.path}`, id: fileId, uploaded: true });
        }
      } catch (err) {
        newUploads.push({ file, key: "", id: fileId, uploaded: false, error: err instanceof Error ? err.message : "Upload failed" });
      }
    }

    setChatAttachments(prev => [...prev, ...newUploads]);
    setChatUploading(false);
    e.target.value = "";
  };

  const handleRemoveChatAttachment = async (index: number) => {
    const fileToRemove = chatAttachments[index];
    if (fileToRemove?.uploaded && fileToRemove.key) {
      const filePath = fileToRemove.key.replace("ticket-attachments/", "");
      await supabase.storage.from("ticket-attachments").remove([filePath]);
    }
    setChatAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async () => {
    const hasMessage = newMessage.trim().length > 0;
    if (!hasMessage || !userId || !userEmail || chatUploading) return;
    
    const messageText = newMessage.trim();
    const tempId = Date.now();
    const successfulUploads = chatAttachments.filter(f => f.uploaded);
    const attachmentPayload = successfulUploads.map(f => ({ Key: f.key, Id: f.id }));
    
    // Optimistic update - add message immediately to UI
    const tempMessage: ChatMessage = {
      id: tempId,
      message: messageText,
      attachments: attachmentPayload,
      senderType: "ADMIN",
      senderEmail: userEmail,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setChatAttachments([]);
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
            message: messageText || "",
            attachments: attachmentPayload,
          }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.message || data.id) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, id: data.id || data.message?.id || tempId }
                : msg
            )
          );
        }
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageText);
        setChatAttachments(successfulUploads);
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText);
      setChatAttachments(successfulUploads);
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
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-xl z-50 flex flex-col">
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
                ? "text-foreground border-b-2 border-foreground"
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
                ? "text-foreground border-b-2 border-foreground"
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
                <div className="bg-muted dark:bg-muted/50 rounded-lg p-4">
                  {attachmentUrls.length > 0 ? (
                    <div className="space-y-3">
                      {attachmentUrls.map((url, index) => {
                        const fileName = detailedReview.payload?.attachments?.[index]?.Key.split('/').pop() || 'attachment';
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                        
                        return (
                          <div key={index} className="bg-card rounded border border-border overflow-hidden">
                            {isImage ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={url}
                                  alt={fileName}
                                  className="w-full h-40 object-contain bg-muted"
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
                                className="flex items-center justify-center h-20 hover:bg-muted transition-colors"
                              >
                                <p className="text-sm font-medium text-blue-600 underline">
                                  {fileName}
                                </p>
                              </a>
                            )}
                            <div className="px-3 py-2 border-t border-border bg-muted">
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
                <label className="text-sm font-medium text-foreground block mb-2">
                  Description
                </label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {detailedReview.description}
                </p>
              </div>
            )}

            {/* Legal Owner */}
            {detailedReview.legalOwnerId && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Legal Owner
                </label>
                <p className="text-sm text-muted-foreground">{detailedReview.legalOwnerId}</p>
              </div>
            )}

            {/* Assigned Team */}
            {detailedReview.assignedTeamId && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Assigned Team
                </label>
                <Badge className="bg-green-600 dark:bg-green-700 text-white rounded px-3">
                  {detailedReview.assignedTeamId}
                </Badge>
              </div>
            )}
          </div>
        ) : activeTab === "chat" ? (
          <div className="flex flex-col h-full bg-gradient-to-b from-muted/50 to-background rounded-xl">
            {/* Chat Header with Refresh */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <span className="text-xs text-muted-foreground">Messages</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={async () => {
                  if (!userId && !userEmail) return;
                  setLoadingMessages(true);
                  try {
                    const queryParam = userId ? `user_id=${userId}` : `email=${userEmail}`;
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
                    console.error("Error refreshing messages:", error);
                  } finally {
                    setLoadingMessages(false);
                  }
                }}
                disabled={loadingMessages}
                title="Refresh messages"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingMessages && "animate-spin")} />
              </Button>
            </div>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              {loadingMessages ? (
                <div className="space-y-4 px-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "rounded-2xl p-4 animate-pulse",
                        i % 2 === 0 ? "bg-muted w-2/3" : "bg-muted/70 w-3/4"
                      )}>
                        <div className="h-3 bg-muted-foreground/20 rounded w-16 mb-2" />
                        <div className="h-4 bg-muted-foreground/20 rounded w-full mb-1" />
                        <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 shadow-inner">
                    <Send className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Start the conversation below</p>
                </div>
              ) : (
                <div className="space-y-3 px-1">
                  {messages.map((msg, index) => {
                    // Check if the message is from the current user by comparing emails
                    const isCurrentUser = userEmail && msg.senderEmail?.toLowerCase() === userEmail.toLowerCase();
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                          isCurrentUser ? "items-end" : "items-start"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Sender Badge */}
                        <div className={cn(
                          "flex items-center gap-1.5 mb-1.5 px-1",
                          isCurrentUser ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                            isCurrentUser 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          )}>
                            {msg.senderEmail?.charAt(0).toUpperCase() || (isCurrentUser ? "Y" : "U")}
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold tracking-wide",
                            isCurrentUser ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400"
                          )}>
                            {isCurrentUser ? "You" : msg.senderEmail?.split('@')[0] || msg.senderType}
                          </span>
                        </div>
                        
                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-white dark:bg-muted border border-border text-foreground rounded-tl-sm shadow-sm"
                          )}
                        >
                          {msg.message && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          )}
                          {/* Render message attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={cn("space-y-1.5", msg.message && "mt-2")}>
                              {msg.attachments.map((att, attIdx) => {
                                const attKey = typeof att === "string" ? att : att.Key;
                                const fileName = attKey.split("/").pop() || "attachment";
                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                                return (
                                  <ChatAttachmentPreview
                                    key={attIdx}
                                    attKey={attKey}
                                    fileName={fileName}
                                    isImage={isImage}
                                    isCurrentUser={!!isCurrentUser}
                                  />
                                );
                              })}
                            </div>
                          )}
                          <p className={cn(
                            "text-[10px] mt-2 flex items-center gap-1",
                            isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground"
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

            {/* AI Reply Suggestions */}
            {showSuggestions && (
              <div className="px-3 py-2 border-t border-border/50 bg-muted/30 dark:bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-primary shadow-sm">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">AI Suggestions</span>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {loadingSuggestions ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-16 rounded-xl bg-background/60 dark:bg-muted/40 animate-pulse border border-border/50"
                      />
                    ))}
                  </div>
                ) : aiSuggestions.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setNewMessage(suggestion);
                          setShowSuggestions(false);
                          // Trigger textarea resize
                          setTimeout(() => {
                            if (textareaRef.current) {
                              textareaRef.current.style.height = 'auto';
                              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                            }
                          }, 0);
                        }}
                        className="flex-1 min-w-[180px] max-w-[280px] p-3 text-left text-xs rounded-xl bg-background dark:bg-muted/60 border border-border hover:border-primary/50 hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md group"
                      >
                        <p className="line-clamp-5 text-foreground/80 group-hover:text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {suggestion}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No suggestions available</p>
                )}
              </div>
            )}

            {/* Enhanced Message Preview */}
            {showEnhanced && enhancedVersions.length > 0 && (
              <div className="px-3 py-2 border-t border-border/50 bg-muted/30 dark:bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-primary shadow-sm">
                      <Wand2 className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">Enhanced Versions</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowEnhanced(false);
                      setEnhancedVersions([]);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {enhancedVersions.map((version, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewMessage(version);
                        setShowEnhanced(false);
                        setEnhancedVersions([]);
                        // Trigger textarea resize
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                          }
                        }, 0);
                      }}
                      className="flex-1 min-w-[180px] max-w-[280px] p-3 text-left text-xs rounded-xl bg-background dark:bg-muted/60 border border-border hover:border-primary/50 hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md group"
                    >
                      <p className="line-clamp-5 text-foreground/80 group-hover:text-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {version}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-3 border-t border-border bg-card dark:bg-muted/30 backdrop-blur-sm">
              {/* Pending Attachment Previews */}
              {chatAttachments.length > 0 && (
                <div className="mb-2 rounded-xl bg-muted/40 border border-border/50 p-2">
                  <div className="flex flex-wrap gap-2">
                    {chatAttachments.map((att, index) => {
                      const isImage = att.file.type.startsWith("image/");
                      const previewUrl = isImage && att.uploaded ? URL.createObjectURL(att.file) : null;
                      return (
                        <div
                          key={att.id}
                          className={cn(
                            "relative group rounded-xl overflow-hidden border transition-all",
                            isImage ? "w-20 h-20" : "flex items-center gap-2 px-3 py-2",
                            att.uploaded
                              ? "border-border bg-background shadow-sm"
                              : att.error
                                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                                : "border-border bg-muted animate-pulse"
                          )}
                        >
                          {isImage && previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={att.file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : isImage ? (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="max-w-[100px] truncate text-xs text-foreground/80">
                                {att.file.name}
                              </span>
                            </>
                          )}
                          {att.error && !isImage && (
                            <span className="text-[10px] text-red-500" title={att.error}>!</span>
                          )}
                          {/* Remove button overlay */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveChatAttachment(index); }}
                            className={cn(
                              "absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                              !isImage && "relative top-auto right-auto bg-transparent opacity-100 ml-auto"
                            )}
                          >
                            <X className={cn("h-3 w-3", isImage ? "text-white" : "text-muted-foreground hover:text-destructive")} />
                          </button>
                          {att.error && isImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 dark:bg-red-900/40">
                              <span className="text-[9px] text-red-600 font-medium">Error</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {chatUploading && (
                      <div className="flex items-center justify-center w-20 h-20 rounded-xl border border-dashed border-border bg-muted/50">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* AI Buttons */}
              <div className="flex items-center justify-end gap-2 mb-2">
                {/* Enhance Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!newMessage.trim()) return;
                    setLoadingEnhance(true);
                    try {
                      const response = await fetch('/api/agent/enhance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: newMessage }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        if (data.enhancedVersions && data.enhancedVersions.length > 0) {
                          setEnhancedVersions(data.enhancedVersions);
                          setShowEnhanced(true);
                          setShowSuggestions(false);
                        }
                      }
                    } catch (error) {
                      console.error('Error enhancing message:', error);
                    } finally {
                      setLoadingEnhance(false);
                    }
                  }}
                  disabled={loadingEnhance || !newMessage.trim()}
                  className={cn(
                    "h-7 px-2.5 gap-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                    showEnhanced
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "bg-secondary/80 dark:bg-secondary/20 text-secondary-foreground dark:text-foreground hover:bg-secondary border border-border"
                  )}
                >
                  <Wand2 className={cn("h-3.5 w-3.5", loadingEnhance && "animate-pulse")} />
                  {loadingEnhance ? "Enhancing..." : showEnhanced ? "Hide" : "Enhance"}
                </Button>
                {/* AI Suggest Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (showSuggestions) {
                      setShowSuggestions(false);
                      return;
                    }
                    setShowSuggestions(true);
                    setShowEnhanced(false);
                    setLoadingSuggestions(true);
                    try {
                      const response = await fetch('/api/agent/suggest-replies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: messages.slice(-6).map(m => ({
                            senderType: m.senderType,
                            senderEmail: m.senderEmail,
                            message: m.message,
                          })),
                          context: {
                            ticketTitle: review.title,
                            ticketEmail: review.email,
                          },
                        }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setAiSuggestions(data.suggestions || []);
                      }
                    } catch (error) {
                      console.error('Error fetching suggestions:', error);
                    } finally {
                      setLoadingSuggestions(false);
                    }
                  }}
                  disabled={loadingSuggestions || messages.length === 0}
                  className={cn(
                    "h-7 px-2.5 gap-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                    showSuggestions
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "bg-secondary/80 dark:bg-secondary/20 text-secondary-foreground dark:text-foreground hover:bg-secondary border border-border"
                  )}
                >
                  <Sparkles className={cn("h-3.5 w-3.5", loadingSuggestions && "animate-pulse")} />
                  {loadingSuggestions ? "Thinking..." : showSuggestions ? "Hide AI" : "AI Suggest"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={chatFileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  onChange={handleChatFileChange}
                  disabled={chatUploading || chatAttachments.length >= MAX_FILES_COUNT}
                />
                {/* Attach button */}
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  disabled={chatUploading || chatAttachments.length >= MAX_FILES_COUNT || sendingMessage}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 shrink-0 rounded-xl transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed",
                    chatAttachments.length > 0
                      ? "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                      : "text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  )}
                  title={chatAttachments.length >= MAX_FILES_COUNT ? `Max ${MAX_FILES_COUNT} files` : "Attach files"}
                >
                  {chatUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>
                {/* Textarea */}
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full h-10 min-h-[40px] max-h-[120px] px-4 py-2.5 rounded-xl border border-border bg-background dark:bg-muted focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground resize-none text-sm leading-tight"
                    disabled={sendingMessage}
                    style={{ overflow: 'hidden' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                {/* Send button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage || chatUploading}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 shrink-0 rounded-xl transition-all duration-300 disabled:cursor-not-allowed",
                    newMessage.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg" 
                      : "bg-muted dark:bg-muted/50 text-muted-foreground shadow-none"
                  )}
                >
                  <Send className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    sendingMessage && "animate-pulse",
                    newMessage.trim() && "translate-x-px -translate-y-px"
                  )} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
