"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Icons } from "~/components/icons";
import { cn } from "~/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import {
  createChat,
  CreateChatAIError,
  getChat,
  sendMessage as sendChatMessage,
  type ChatMessage as APIChatMessage,
} from "~/lib/silo-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
    ),
    title: "Review a Contract",
    subtitle: "Analyze key clauses in an NDA",
    prompt: "Can you review this NDA agreement and highlight key clauses?",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    ),
    title: "Legal Research",
    subtitle: "Data privacy compliance in India",
    prompt: "What are the key compliance requirements for data privacy in India?",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500 dark:text-violet-400"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
    ),
    title: "Draft a Document",
    subtitle: "Employment agreement template",
    prompt: "Help me draft a standard employment agreement template.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 dark:text-amber-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    ),
    title: "Clause Analysis",
    subtitle: "Key vendor agreement clauses",
    prompt: "What are the key clauses I should look for in a vendor agreement?",
  },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <Icons.ai className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-muted/50 px-4 py-3">
        <span className="silo-typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="silo-typing-dot" style={{ animationDelay: "150ms" }} />
        <span className="silo-typing-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  return (
    <div className="silo-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-7 text-foreground/90">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 [&>li]:leading-7 marker:text-muted-foreground/50">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 [&>li]:leading-7 marker:text-muted-foreground/50">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-xl border border-border/40 bg-muted/60 px-4 py-3.5 text-[13px] leading-6 font-mono text-foreground/90">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[13px] font-mono text-foreground/90 border border-border/30">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="mb-3 last:mb-0">{children}</div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-[3px] border-primary/20 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-xl font-bold text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-semibold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-xl border border-border/40">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border/40 bg-muted/40 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/20 px-4 py-2.5 text-foreground/80">
              {children}
            </td>
          ),
          hr: () => <hr className="my-5 border-border/30" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2 decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentPage() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("silo-chat-sessions");
      if (saved) {
        const parsed = JSON.parse(saved) as Array<{ id: string; title: string; updatedAt: string }>;
        return parsed.map((s) => ({ ...s, updatedAt: new Date(s.updatedAt) }));
      }
    } catch { /* ignore */ }
    return [];
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Scroll to bottom ─────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ─── Persist chat sessions to localStorage ────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem("silo-chat-sessions", JSON.stringify(chatSessions));
    } catch { /* ignore */ }
  }, [chatSessions]);

  // ─── Auto-resize textarea ─────────────────────────────────────────

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "24px";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  // ─── Poll for response ────────────────────────────────────────────

  const pollForResponse = useCallback(
    async (chatId: string, knownMessageIds: Set<string>) => {
      const maxAttempts = 15; // ~30 seconds
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        try {
          const chat = await getChat(chatId);
          if (!chat?.messages) continue;

          const newMsg = chat.messages.find(
            (m: APIChatMessage) =>
              m.role === "assistant" && !knownMessageIds.has(m.id),
          );

          if (newMsg) {
            setMessages((prev) => [
              ...prev.filter((m) => !m.isStreaming),
              {
                id: newMsg.id,
                role: "assistant",
                content: newMsg.content,
                timestamp: new Date(newMsg.createdAt),
              },
            ]);
            setIsLoading(false);
            return;
          }
        } catch {
          // retry silently
        }
      }

      setIsLoading(false);
      toast.error("Response timed out. Please try again.");
    },
    [],
  );

  // ─── Submit handler ───────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const text = overrideInput ?? input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let chatId = activeChatId;

      if (!chatId) {
        // ── First message: create chat room WITH initialMessage ──
        const title = text.length > 60 ? text.slice(0, 60) + "..." : text;

        try {
          const chat = await createChat({
            title,
            initialMessage: text,
            context: { legalTopic: "contracts", jurisdiction: "India", documentType: "NDA" },
          });

          chatId = chat.id;
          setActiveChatId(chatId);
          setChatSessions((prev) => [
            { id: chatId!, title, updatedAt: new Date() },
            ...prev,
          ]);

          // Check if the backend already returned an AI reply
          const knownIds = new Set<string>();
          if (chat.messages) {
            for (const m of chat.messages) {
              knownIds.add(m.id);
              if (m.role === "assistant") {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: m.id,
                    role: "assistant",
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                  },
                ]);
                setIsLoading(false);
                return;
              }
            }
          }
          knownIds.add(userMsg.id);
          // No AI reply yet – poll for it
          void pollForResponse(chatId, knownIds);
        } catch (createErr) {
          if (createErr instanceof CreateChatAIError) {
            // Chat was likely created but AI generation failed.
            // We don't have the chatId, so stop loading and show a friendly message.
            setIsLoading(false);
            toast.error("AI is temporarily unavailable. Please try again in a moment.");
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
            return;
          }
          throw createErr;
        }
      } else {
        // ── Follow-up message: send via messages endpoint ──
        let knownIds = new Set<string>();
        try {
          const existing = await getChat(chatId);
          if (existing?.messages) {
            knownIds = new Set(
              existing.messages.map((m: APIChatMessage) => m.id),
            );
          }
        } catch {
          /* ignore */
        }
        knownIds.add(userMsg.id);

        const resp = await sendChatMessage(chatId, { content: text });

        // If the backend returned the AI reply directly, show it
        if (resp && "content" in resp && resp.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: (resp as APIChatMessage).id ?? crypto.randomUUID(),
              role: "assistant" as const,
              content: resp.content as string,
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }

        // Otherwise poll for the AI reply
        void pollForResponse(chatId, knownIds);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to send message";
      toast.error(msg);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setIsLoading(false);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const chat = await getChat(chatId);
      setActiveChatId(chatId);
      setMessages(
        (chat.messages ?? []).map((m: APIChatMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
        })),
      );
      setHistoryOpen(false);
    } catch {
      toast.error("Failed to load chat.");
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  const isEmptyState = messages.length === 0;

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen flex-col overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border/50 bg-background px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            }}
          >
            <Icons.ai className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold leading-none text-foreground">
              SILO Agent
            </h1>
            <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
              {isLoading ? "Thinking..." : "Legal AI Assistant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-[0.97]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-[0.97]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>

      {/* ── Messages / Empty State ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {isEmptyState ? (
          <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 sm:px-6">
            {/* Logo */}
            <div
              className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg animate-fade-in-up"
              style={{
                background:
                  "linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
              }}
            >
              <Icons.ai className="h-10 w-10 text-white" />
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl animate-fade-in-up-delay-1">
              How can I help you today?
            </h2>
            <p className="mb-10 max-w-lg text-center text-sm leading-relaxed text-muted-foreground animate-fade-in-up-delay-2">
              Your AI-powered legal assistant. Ask about contracts, compliance,
              document drafting, or any legal question.
            </p>

            {/* Suggestion grid */}
            <div className="grid w-full max-w-[640px] grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in-up-delay-3">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => void handleSubmit(undefined, s.prompt)}
                  className="group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 text-left shadow-sm transition-all duration-200 hover:border-border hover:shadow-md active:scale-[0.98]"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Message List ─────────────────────────────────────────── */
          <div className="mx-auto w-full max-w-[780px] px-4 py-6 sm:px-6">
            <div className="space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "silo-msg-enter",
                    msg.role === "user" ? "flex justify-end" : "",
                  )}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] sm:max-w-[70%]">
                      <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground shadow-sm">
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      <p className="mt-1 pr-1 text-right text-[10px] text-muted-foreground/40">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                        style={{
                          background:
                            "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        }}
                      >
                        <Icons.ai className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <MessageContent content={msg.content} />
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground/40">
                            {formatTime(msg.timestamp)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(msg.content);
                              toast.success("Copied to clipboard");
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                width="14"
                                height="14"
                                x="8"
                                y="8"
                                rx="2"
                              />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>
        )}
      </div>

      {/* ── Input Area ───────────────────────────────────────────────── */}
      <div className="shrink-0 bg-background px-4 pb-4 pt-2 sm:px-6">
        <div className="mx-auto w-full max-w-[780px]">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card shadow-sm transition-all duration-200",
                input
                  ? "border-ring/40 shadow-[0_0_0_3px_hsl(var(--ring)/0.06)]"
                  : "border-border/60 hover:border-border",
              )}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isEmptyState
                    ? "Ask about contracts, compliance, legal drafting..."
                    : "Send a message..."
                }
                rows={1}
                disabled={isLoading}
                className="w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-1 text-[14px] leading-relaxed text-foreground outline-none ring-0 placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none disabled:opacity-60"
                style={{ minHeight: "24px", maxHeight: "160px" }}
              />

              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                    title="Attach file"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-200",
                    input.trim() && !isLoading
                      ? "opacity-100 hover:scale-105 active:scale-95"
                      : "opacity-30 cursor-not-allowed",
                  )}
                  style={{
                    background:
                      "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                  }}
                >
                  {isLoading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
            SILO Agent may produce inaccurate information. Verify important
            legal details independently.
          </p>
        </div>
      </div>

      {/* ── Chat History Sheet ───────────────────────────────────────── */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
          <SheetHeader className="border-b border-border/50 px-5 py-4">
            <SheetTitle className="text-base">Chat History</SheetTitle>
            <SheetDescription className="text-xs">
              Your previous conversations
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-80px)]">
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                    <Icons.messageSquare className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/60">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/40">
                    Start a chat to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => void loadChat(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        activeChatId === s.id
                          ? "bg-primary/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icons.messageSquare className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border/50 px-5 py-3">
              <button
                onClick={startNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Conversation
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
