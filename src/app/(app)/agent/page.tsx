"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { Icons } from "~/components/icons";
import { ChatSummaryModal } from "~/components/chat-summary-modal";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/auth/client";
import { getSessionAuthHeader } from "~/lib/api-auth";
import { env } from "~/env";
import { api } from "~/trpc/react";
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

// ─── Themes ──────────────────────────────────────────────────────────────────

export type AgentThemeId =
  | "snow"
  | "midnight"
  | "sage"
  | "blush"
  | "slate"
  | "dusk";

export interface AgentTheme {
  id: AgentThemeId;
  name: string;
  description: string;
  // CSS custom properties injected on the root wrapper
  vars: {
    "--at-bg": string;
    "--at-topbar": string;
    "--at-border": string;
    "--at-input-bg": string;
    "--at-user-bubble": string;
    "--at-user-text": string;
    "--at-s-ring": string;
    "--at-muted": string;
    "--at-accent": string;
    "--at-send-bg": string;
    "--at-send-text": string;
  };
  // swatch preview gradient
  swatch: string;
}

export const AGENT_THEMES: AgentTheme[] = [
  {
    id: "snow",
    name: "Snow",
    description: "Pure white · crisp",
    swatch: "#ffffff",
    vars: {
      "--at-bg": "#ffffff",
      "--at-topbar": "rgba(255,255,255,0.96)",
      "--at-border": "rgba(0,0,0,0.08)",
      "--at-input-bg": "#ffffff",
      "--at-user-bubble": "#111111",
      "--at-user-text": "#ffffff",
      "--at-s-ring": "rgba(0,0,0,0.18)",
      "--at-muted": "rgba(0,0,0,0.42)",
      "--at-accent": "rgba(0,0,0,0.06)",
      "--at-send-bg": "#111111",
      "--at-send-text": "#ffffff",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy · luxury",
    swatch: "linear-gradient(135deg,#0d1117 0%,#161b27 100%)",
    vars: {
      "--at-bg": "#0d1117",
      "--at-topbar": "rgba(13,17,23,0.97)",
      "--at-border": "rgba(255,255,255,0.07)",
      "--at-input-bg": "#131920",
      "--at-user-bubble": "#e8eaf0",
      "--at-user-text": "#0d1117",
      "--at-s-ring": "rgba(255,255,255,0.18)",
      "--at-muted": "rgba(255,255,255,0.45)",
      "--at-accent": "rgba(255,255,255,0.05)",
      "--at-send-bg": "#e8eaf0",
      "--at-send-text": "#0d1117",
    },
  },
  {
    id: "sage",
    name: "Sage",
    description: "Cool sage · serene",
    swatch: "linear-gradient(135deg,#eef3ef 0%,#dce8de 100%)",
    vars: {
      "--at-bg": "#eef3ef",
      "--at-topbar": "rgba(238,243,239,0.97)",
      "--at-border": "rgba(90,120,95,0.14)",
      "--at-input-bg": "#f5f8f5",
      "--at-user-bubble": "#2d4a32",
      "--at-user-text": "#f5f8f5",
      "--at-s-ring": "rgba(45,74,50,0.3)",
      "--at-muted": "rgba(45,74,50,0.5)",
      "--at-accent": "rgba(45,74,50,0.06)",
      "--at-send-bg": "#2d4a32",
      "--at-send-text": "#f5f8f5",
    },
  },
  {
    id: "blush",
    name: "Blush",
    description: "Warm rose · soft",
    swatch: "linear-gradient(135deg,#fdf0f0 0%,#f5dedd 100%)",
    vars: {
      "--at-bg": "#fdf0f0",
      "--at-topbar": "rgba(253,240,240,0.97)",
      "--at-border": "rgba(160,80,80,0.12)",
      "--at-input-bg": "#fdf6f6",
      "--at-user-bubble": "#5c2323",
      "--at-user-text": "#fdf6f6",
      "--at-s-ring": "rgba(140,60,60,0.28)",
      "--at-muted": "rgba(120,60,60,0.5)",
      "--at-accent": "rgba(160,80,80,0.06)",
      "--at-send-bg": "#5c2323",
      "--at-send-text": "#fdf6f6",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool gray · focus",
    swatch: "linear-gradient(135deg,#f0f2f5 0%,#e3e7ed 100%)",
    vars: {
      "--at-bg": "#f0f2f5",
      "--at-topbar": "rgba(240,242,245,0.97)",
      "--at-border": "rgba(60,80,120,0.1)",
      "--at-input-bg": "#f8f9fb",
      "--at-user-bubble": "#1e2d4a",
      "--at-user-text": "#f8f9fb",
      "--at-s-ring": "rgba(30,45,74,0.25)",
      "--at-muted": "rgba(30,45,74,0.45)",
      "--at-accent": "rgba(60,80,120,0.06)",
      "--at-send-bg": "#1e2d4a",
      "--at-send-text": "#f8f9fb",
    },
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Warm amber · calm",
    swatch: "linear-gradient(135deg,#fdf6ec 0%,#f5e8d0 100%)",
    vars: {
      "--at-bg": "#fdf6ec",
      "--at-topbar": "rgba(253,246,236,0.97)",
      "--at-border": "rgba(140,90,30,0.12)",
      "--at-input-bg": "#fefaf4",
      "--at-user-bubble": "#4a2c0a",
      "--at-user-text": "#fefaf4",
      "--at-s-ring": "rgba(100,60,10,0.25)",
      "--at-muted": "rgba(100,60,10,0.48)",
      "--at-accent": "rgba(140,90,30,0.06)",
      "--at-send-bg": "#4a2c0a",
      "--at-send-text": "#fefaf4",
    },
  },
];

// ─── Theme Picker ─────────────────────────────────────────────────────────────

function ThemePicker({
  current,
  onChange,
}: {
  current: AgentThemeId;
  onChange: (id: AgentThemeId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Position the portal dropdown below the button
  const openPicker = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: coords.top,
        right: coords.right,
        zIndex: 99999,
        width: 272,
        background: "var(--at-topbar)",
        borderColor: "var(--at-border)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--at-border)" }}>
        <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--at-muted)" }}>
          Theme
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {AGENT_THEMES.map((t) => {
          const active = t.id === current;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl px-2 py-2.5 text-center transition-all duration-150",
                active ? "ring-2" : "hover:bg-black/5 dark:hover:bg-white/5",
              )}
              style={active ? { outline: `2px solid var(--at-send-bg)`, outlineOffset: "1px" } : {}}
            >
              {/* Swatch */}
              <div
                className="h-9 w-9 rounded-full border shadow-sm transition-transform group-hover:scale-105"
                style={{
                  background: t.swatch,
                  borderColor: "var(--at-border)",
                }}
              />
              <div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: active ? "var(--at-send-bg)" : "var(--at-muted)" }}>
                  {t.name}
                </p>
              </div>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: "var(--at-send-bg)" }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5l3 3 5-5" stroke="var(--at-send-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        title="Change theme"
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
          open
            ? "border-[var(--at-border)] bg-[var(--at-accent)]"
            : "border-[var(--at-border)] hover:bg-[var(--at-accent)]",
        )}
        style={{ color: "var(--at-muted)" }}
      >
        {/* Palette icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
      {typeof document !== "undefined" && open
        ? createPortal(dropdown, document.body)
        : null}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: { name: string; size: number }[];
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ border: "1px solid var(--at-s-ring)", background: "var(--at-bg)" }}
      >
        <span className="text-[11px] font-bold tracking-tighter select-none" style={{ color: "var(--at-send-bg)" }}>S</span>
      </div>
      <div
        className="flex items-center gap-1 rounded-2xl px-4 py-3"
        style={{ border: "1px solid var(--at-border)", background: "var(--at-accent)" }}
      >
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
    <div className="silo-prose" style={{ color: "var(--at-send-bg)" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-7" style={{ color: "var(--at-send-bg)", opacity: 0.9 }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 [&>li]:leading-7" style={{ color: "var(--at-send-bg)", opacity: 0.9 }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 [&>li]:leading-7" style={{ color: "var(--at-send-bg)", opacity: 0.9 }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: "var(--at-send-bg)" }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic" style={{ color: "var(--at-send-bg)", opacity: 0.8 }}>{children}</em>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className="block overflow-x-auto rounded-xl px-4 py-3.5 text-[13px] leading-6 font-mono"
                  style={{ background: "var(--at-accent)", color: "var(--at-send-bg)", border: "1px solid var(--at-border)" }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded-md px-1.5 py-0.5 text-[13px] font-mono"
                style={{ background: "var(--at-accent)", color: "var(--at-send-bg)", border: "1px solid var(--at-border)" }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="mb-3 last:mb-0">{children}</div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-[3px] pl-4 italic" style={{ borderColor: "var(--at-s-ring)", color: "var(--at-muted)" }}>
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-xl font-bold first:mt-0" style={{ color: "var(--at-send-bg)" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-semibold first:mt-0" style={{ color: "var(--at-send-bg)" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0" style={{ color: "var(--at-send-bg)" }}>
              {children}
            </h3>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-xl" style={{ border: "1px solid var(--at-border)" }}>
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--at-border)", background: "var(--at-accent)", color: "var(--at-muted)" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--at-border)", color: "var(--at-send-bg)", opacity: 0.8 }}>
              {children}
            </td>
          ),
          hr: () => <hr className="my-5" style={{ borderColor: "var(--at-border)" }} />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 transition-colors"
              style={{ color: "var(--at-send-bg)", textDecorationColor: "var(--at-s-ring)" }}
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
  // ─── Auth & user context ───────────────────────────────────────
  const { data: auth } = authClient.useSession();
  const currentUser = auth?.user;
  const organizationId = auth?.session?.activeOrganizationId;

  // Fetch current user role
  // ─── Theme ──────────────────────────────────────────────────────────
  const [themeId, setThemeId] = useState<AgentThemeId>(() => {
    if (typeof window === "undefined") return "snow";
    return (localStorage.getItem("silo-agent-theme") as AgentThemeId) ?? "snow";
  });

  const theme = AGENT_THEMES.find((t) => t.id === themeId) ?? AGENT_THEMES[0]!;

  const handleThemeChange = useCallback((id: AgentThemeId) => {
    setThemeId(id);
    try { localStorage.setItem("silo-agent-theme", id); } catch { /* ignore */ }
    // Notify sidebar and other listeners about theme change
    window.dispatchEvent(new CustomEvent("silo-agent-theme-change", { detail: id }));
  }, []);

  const { data: userRoleData } = api.member.getCurrentUserRole.useQuery(undefined, {
    enabled: !!auth?.session?.activeOrganizationId,
  });
  const userRole = userRoleData?.role as "admin" | "owner" | "member" | "legal" | undefined;

  // Role-aware greeting text
  const greetingConfig = (() => {
    if (!userRole) return { headline: "Good to see you.", sub: "Ask me anything." };
    if (userRole === "admin" || userRole === "owner") {
      return {
        headline: "What can I help you with?",
        sub: "Manage requests, categories, teams, or get insights about your organisation.",
      };
    }
    if (userRole === "legal") {
      return {
        headline: "Ready to assist.",
        sub: "Review documents, analyse clauses, or research legal questions.",
      };
    }
    // member
    return {
      headline: "How can I help?",
      sub: "Ask about your requests, track status, or get general guidance.",
    };
  })();

  // State – restore active chat from sessionStorage so switching tabs doesn't lose the conversation
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("silo-active-chat-id") ?? null;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("silo-active-chat-messages");
      if (saved) {
        const parsed = JSON.parse(saved) as Array<Message & { timestamp: string }>;
        return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch { /* ignore */ }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [userTickets, setUserTickets] = useState<
    Array<{
      id: string;
      title: string;
      type: string;
      priority: string | null;
      workflowStatus: string | null;
      category: string | null;
      createdAt: string;
    }>
  >([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevTranscriptRef = useRef<string>("");

  // ─── Voice Recognition ────────────────────────────────────────

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Sync live transcript into the input field while listening.
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (listening && transcript && transcript !== prevTranscriptRef.current) {
      setInput(transcript);
      // Reset the silence timer whenever new speech is detected
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        SpeechRecognition.stopListening();
      }, 3000);
    }
    prevTranscriptRef.current = transcript;
  }, [transcript, listening]);

  // Start a silence timer when listening begins (in case user never speaks)
  useEffect(() => {
    if (listening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        SpeechRecognition.stopListening();
      }, 3000);
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [listening]);

  const toggleVoiceInput = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Your browser does not support speech recognition. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      prevTranscriptRef.current = "";
      setInput("");
      void SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
    }
  }, [listening, browserSupportsSpeechRecognition, resetTranscript]);

  // ─── Scroll to bottom ─────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ─── Fetch user tickets for AI context ────────────────────────────

  useEffect(() => {
    if (!currentUser?.id || !organizationId) return;

    const API_BASE = env.NEXT_PUBLIC_API_BASE_URL;
    const sessionAuthHeader = getSessionAuthHeader(auth);

    async function fetchUserTickets() {
      if (!sessionAuthHeader) return;
      try {
        const res = await fetch(
          `${API_BASE}/api/get-all-tickets?user_id=${currentUser!.id}&organization_id=${organizationId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: sessionAuthHeader,
            },
          },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          tickets?: Array<{
            id: number;
            email: string;
            priority: string | null;
            workflowStatus: string | null;
            summary: string | null;
            sourceType: string;
            createdAt: string;
            category: { name: string } | null;
            requestForm: { name: string } | null;
          }>;
        };
        const tickets = (data.tickets ?? [])
          .filter((t) => t.email === currentUser!.email)
          .map((t) => ({
            id: String(t.id),
            title:
              t.sourceType === "INTERNAL"
                ? t.summary ?? ""
                : t.requestForm?.name ?? "",
            type: t.sourceType ?? "INTERNAL",
            priority: t.priority,
            workflowStatus: t.workflowStatus,
            category: t.category?.name ?? null,
            createdAt: t.createdAt,
          }));
        setUserTickets(tickets);
      } catch {
        // Non-critical
      }
    }

    void fetchUserTickets();
  }, [currentUser?.id, currentUser?.email, organizationId, auth?.session?.token]);

  // ─── Persist chat sessions to localStorage ────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem("silo-chat-sessions", JSON.stringify(chatSessions));
    } catch { /* ignore */ }
  }, [chatSessions]);

  // ─── Persist active chat to sessionStorage ──────────────────────

  useEffect(() => {
    try {
      if (activeChatId) {
        sessionStorage.setItem("silo-active-chat-id", activeChatId);
      } else {
        sessionStorage.removeItem("silo-active-chat-id");
      }
    } catch { /* ignore */ }
  }, [activeChatId]);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem("silo-active-chat-messages", JSON.stringify(messages));
      } else {
        sessionStorage.removeItem("silo-active-chat-messages");
      }
    } catch { /* ignore */ }
  }, [messages]);

  // ─── Auto-resize textarea ─────────────────────────────────────────

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "24px";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  // ─── File attachment helpers ───────────────────────────────────────

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
  const MAX_FILES = 5;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      const remaining = MAX_FILES - attachedFiles.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const toAdd: File[] = [];
      for (const file of files.slice(0, remaining)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds 25 MB limit`);
          continue;
        }
        if (attachedFiles.some((f) => f.name === file.name && f.size === file.size)) continue;
        toAdd.push(file);
      }

      if (toAdd.length > 0) {
        setAttachedFiles((prev) => [...prev, ...toAdd]);
      }

      e.target.value = "";
    },
    [attachedFiles],
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    return "file";
  };

  // ─── Poll for response ────────────────────────────────────────────

  const pollForResponse = useCallback(
    async (chatId: string, knownMessageIds: Set<string>) => {
      const maxAttempts = 15;
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

    const filesToSend = [...attachedFiles];

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
      attachments: filesToSend.length > 0
        ? filesToSend.map((f) => ({ name: f.name, size: f.size }))
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    if (listening) {
      SpeechRecognition.stopListening();
    }
    resetTranscript();
    prevTranscriptRef.current = "";

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const title = text.length > 60 ? text.slice(0, 60) + "..." : text;

        try {
          const chat = await createChat({
            title,
            initialMessage: text,
            context: {
              ...(currentUser
                ? {
                    currentUser: {
                      id: currentUser.id,
                      name: currentUser.name ?? "",
                      email: currentUser.email ?? "",
                      organizationId: organizationId ?? undefined,
                    },
                  }
                : {}),
              ...(userTickets.length > 0
                ? { userRequests: userTickets }
                : {}),
            },
          });

          chatId = chat.id;
          setActiveChatId(chatId);
          setChatSessions((prev) => [
            { id: chatId!, title, updatedAt: new Date() },
            ...prev,
          ]);

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

        const resp = await sendChatMessage(chatId, {
          content: text,
          ...(filesToSend.length > 0 ? { attachments: filesToSend } : {}),
        });

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

  const canSubmit = !!input.trim() && !isLoading;

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  const isEmptyState = messages.length === 0;

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div
      className="flex h-[calc(100vh-56px)] md:h-screen flex-col overflow-hidden transition-colors duration-300"
      style={{
        ...(theme.vars as React.CSSProperties),
        background: "var(--at-bg)",
        borderLeft: "1px solid var(--at-border)",
        boxShadow: "inset 4px 0 16px color-mix(in srgb, var(--at-send-bg) 3%, transparent)",
      }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div
        className="flex h-[52px] shrink-0 items-center justify-between px-4 sm:px-6 backdrop-blur-sm"
        style={{
          background: "var(--at-topbar)",
          borderBottom: "1px solid var(--at-border)",
          boxShadow: "0 1px 0 var(--at-border), 0 2px 8px color-mix(in srgb, var(--at-send-bg) 4%, transparent)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold tracking-tight select-none" style={{ color: "var(--at-send-bg)" }}>
            SILO
          </span>
          <span style={{ color: "var(--at-border)" }} className="select-none">·</span>
          <span className="text-[13px] font-normal select-none" style={{ color: "var(--at-muted)" }}>
            {isLoading ? "Thinking…" : "Agent"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* New Chat */}
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all active:scale-[0.97]"
            style={{
              border: "1px solid var(--at-border)",
              color: "var(--at-muted)",
              background: "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--at-accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>

          {/* History */}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all active:scale-[0.97]"
            style={{
              border: "1px solid var(--at-border)",
              color: "var(--at-muted)",
              background: "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--at-accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Advance Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAdvanceOpen(true)}
            onMouseLeave={() => setAdvanceOpen(false)}
          >
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all active:scale-[0.97]"
              style={{
                border: "1px solid var(--at-border)",
                color: "var(--at-muted)",
                background: advanceOpen ? "var(--at-accent)" : "transparent",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
              <span className="hidden sm:inline">Advance</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {advanceOpen && (
              <div
                className="absolute right-0 top-full z-50 min-w-[140px]"
                style={{ paddingTop: "4px" }}
              >
              <div
                className="rounded-lg overflow-hidden py-1"
                style={{
                  border: "1px solid var(--at-border)",
                  background: "var(--at-bg)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}
              >
                {/* Summary option */}
                <button
                  type="button"
                  disabled={messages.length === 0}
                  onClick={() => { setSummaryOpen(true); setAdvanceOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  style={{ color: "var(--at-muted)", background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--at-accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Summary
                </button>
                {/* Prepare doc option (disabled) */}
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium opacity-30 cursor-not-allowed"
                  style={{ color: "var(--at-muted)", background: "transparent" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16v16H4z" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="12" y2="17" />
                  </svg>
                  Prepare doc
                </button>
              </div>
              </div>
            )}
          </div>

          {/* Theme Picker */}
          <ThemePicker current={themeId} onChange={handleThemeChange} />
        </div>
      </div>

      {/* ── Messages / Empty State ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-smooth" style={{ background: "var(--at-bg)" }}>
        {isEmptyState ? (
          /* ── Clean empty state — no pre-prompts ────────────────────── */
          <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 sm:px-6">
            <div className="w-full max-w-[520px] text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in-up-delay-1" style={{ color: "var(--at-send-bg)" }}>
                {greetingConfig.headline}
              </h2>
              <p className="text-sm leading-relaxed animate-fade-in-up-delay-2" style={{ color: "var(--at-muted)" }}>
                {greetingConfig.sub}
              </p>
            </div>
          </div>
        ) : (
          /* ── Message List ─────────────────────────────────────────── */
          <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "silo-msg-enter",
                    msg.role === "user" ? "flex justify-end" : "",
                  )}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] sm:max-w-[68%]">
                      <div className="rounded-2xl rounded-br-md px-4 py-3 shadow-sm" style={{ background: "var(--at-user-bubble)", color: "var(--at-user-text)" }}>
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                          {msg.content}
                        </p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.attachments.map((att, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px]" style={{ background: "rgba(255,255,255,0.15)", color: "var(--at-user-text)" }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                                {att.name.length > 20 ? att.name.slice(0, 17) + "…" : att.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 pr-1 text-right text-[10px]" style={{ color: "var(--at-muted)", opacity: 0.6 }}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {/* Minimal AI avatar — text only */}
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tighter select-none"
                        style={{ border: "1px solid var(--at-s-ring)", background: "var(--at-bg)", color: "var(--at-send-bg)" }}
                      >
                        S
                      </div>
                      <div className="min-w-0 flex-1">
                        <MessageContent content={msg.content} />
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[10px]" style={{ color: "var(--at-muted)", opacity: 0.6 }}>
                            {formatTime(msg.timestamp)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(msg.content);
                              toast.success("Copied");
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-colors"
                            style={{ color: "var(--at-muted)", opacity: 0.6 }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="14" height="14" x="8" y="8" rx="2" />
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
      <div
        className="shrink-0 px-4 pb-5 pt-3 sm:px-6"
        style={{
          background: "var(--at-bg)",
          borderTop: "2px solid var(--at-border)",
          boxShadow: "0 -4px 24px -4px rgba(0,0,0,0.10), 0 -1px 0 var(--at-border)",
        }}
      >
        <div className="mx-auto w-full max-w-[720px]">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div
              className={cn(
                "relative flex flex-col rounded-2xl transition-all duration-200",
              )}
              style={{
                background: "var(--at-input-bg)",
                border: "1.5px solid var(--at-border)",
                boxShadow: "0 2px 0 0 var(--at-border), 0 4px 16px -4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message SILO Agent…"
                rows={1}
                disabled={isLoading}
                className="w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-1 pr-10 text-[14px] leading-relaxed outline-none ring-0 focus:ring-0 focus:outline-none disabled:opacity-50"
                style={{ color: "var(--at-send-bg)", caretColor: "var(--at-send-bg)", minHeight: "24px", maxHeight: "160px" } as React.CSSProperties}
              />

              {/* Clear input */}
              {input.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    resetTranscript();
                    prevTranscriptRef.current = "";
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--at-muted)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pt-1.5 pb-1">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="group flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40">
                        {getFileIcon(file) === "pdf" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground/80 max-w-[110px]">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground/60">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/40 opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                <div className="flex items-center gap-0.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg"
                  />
                  {/* Attach */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                    style={{ color: attachedFiles.length > 0 ? "var(--at-send-bg)" : "var(--at-muted)", background: attachedFiles.length > 0 ? "var(--at-accent)" : "transparent" }}
                    title={`Attach file (${attachedFiles.length}/${MAX_FILES})`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  {/* Voice */}
                  <div className="relative flex items-center justify-center">
                    {/* Animated pulse rings when listening */}
                    {listening && (
                      <>
                        <span className="absolute inset-0 rounded-lg animate-ping" style={{ background: "rgba(239,68,68,0.25)" }} />
                        <span className="absolute inset-[-3px] rounded-lg animate-pulse" style={{ border: "2px solid rgba(239,68,68,0.4)" }} />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      )}
                      style={{
                        color: listening ? "#ffffff" : "var(--at-muted)",
                        background: listening ? "#ef4444" : "transparent",
                        boxShadow: listening ? "0 0 12px rgba(239,68,68,0.5), 0 0 4px rgba(239,68,68,0.3)" : "none",
                      }}
                      title={listening ? "Stop listening (auto-stops after 3s of silence)" : "Voice input"}
                    >
                      {listening ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Send */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition-all duration-150",
                    canSubmit
                      ? "opacity-100 hover:opacity-90 active:scale-95"
                      : "opacity-20 cursor-not-allowed",
                  )}
                  style={{ background: "var(--at-send-bg)", color: "var(--at-send-text)" }}
                >
                  {isLoading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>

          <p className="mt-2 text-center text-[11px]" style={{ color: "var(--at-muted)", opacity: 0.5 }}>
            SILO Agent can make mistakes. Verify important details independently.
          </p>
        </div>
      </div>

      {/* ── Chat History Sheet ───────────────────────────────────────── */}
      {/* Summary Modal */}
      <ChatSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        messages={messages.map((m) => ({ role: m.role, content: m.content }))}
        themeVars={theme.vars}
        chatId={activeChatId}
      />

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0" style={{ ...(theme.vars as React.CSSProperties), background: theme.vars["--at-bg"], borderLeft: `1px solid ${theme.vars["--at-border"]}`, color: theme.vars["--at-send-bg"] }}>
          <SheetHeader className="px-5 py-4" style={{ borderBottom: "1px solid var(--at-border)" }}>
            <SheetTitle className="text-sm font-semibold" style={{ color: "var(--at-send-bg)" }}>History</SheetTitle>
            <SheetDescription className="text-xs" style={{ color: "var(--at-muted)" }}>
              Previous conversations
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-76px)]">
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm" style={{ color: "var(--at-muted)" }}>No conversations yet</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--at-muted)", opacity: 0.6 }}>Start a chat to see it here</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {chatSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => void loadChat(s.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all"
                      style={{
                        background: activeChatId === s.id ? "var(--at-accent)" : "transparent",
                        color: activeChatId === s.id ? "var(--at-send-bg)" : "var(--at-muted)",
                        fontWeight: activeChatId === s.id ? 600 : 400,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--at-border)" }}>
              <button
                onClick={startNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: "var(--at-send-bg)", color: "var(--at-send-text)" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
