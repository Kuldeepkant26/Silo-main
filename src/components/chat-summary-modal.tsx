"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSummaryModalProps {
  open: boolean;
  onClose: () => void;
  messages: SummaryMessage[];
  themeVars: Record<string, string>;
  chatId?: string;
}

type ViewMode = "preview" | "edit";

/* ── Toolbar button ────────────────────────────────────────────────────────── */
function TBtn({
  icon,
  label,
  onClick,
  muted,
  active,
  activeBg,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  muted: string;
  active?: boolean;
  activeBg?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all hover:opacity-70"
      style={{
        color: muted,
        background: active ? (activeBg || "rgba(0,0,0,0.1)") : undefined,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );
}

/* ── Color picker button ──────────────────────────────────────────────────── */
function TColorBtn({
  label,
  muted,
  borderColor,
  activeBg,
  icon,
  colors,
  onSelect,
}: {
  label: string;
  muted: string;
  borderColor: string;
  activeBg: string;
  icon: React.ReactNode;
  colors: string[];
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={label}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all hover:opacity-70"
        style={{ color: muted }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {icon}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 grid grid-cols-6 gap-1 rounded-lg p-2 shadow-lg"
          style={{ background: activeBg, border: `1px solid ${borderColor}`, minWidth: 148 }}
        >
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(c); setOpen(false); }}
              className="h-5 w-5 rounded-sm border transition-transform hover:scale-110"
              style={{ background: c, borderColor }}
            />
          ))}
          <button
            type="button"
            title="Remove color"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onSelect(""); setOpen(false); }}
            className="flex h-5 w-5 items-center justify-center rounded-sm border text-[9px] font-bold"
            style={{ borderColor, color: muted }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Toolbar divider ───────────────────────────────────────────────────────── */
function TDiv({ borderColor }: { borderColor: string }) {
  return <div className="mx-1 h-4 w-px shrink-0" style={{ background: borderColor }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ChatSummaryModal                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ChatSummaryModal({
  open,
  onClose,
  messages,
  themeVars,
  chatId,
}: ChatSummaryModalProps) {
  /* ── state ──────────────────────────────────────────────────────────────── */
  const [summary, setSummary] = useState("");
  const [summaryVer, setSummaryVer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const refinementRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ── undo / redo history ────────────────────────────────────────────────── */
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSnapshot = useRef<string>("");

  const storageKey = `silo-summary-${chatId || "default"}`;

  /* ── persistence: load on open ──────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setSummary(saved);
          setSummaryVer((v) => v + 1);
          return;
        }
      } catch {
        /* ignore */
      }
      if (messages.length > 0) void generateSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── persistence: save whenever summary changes ─────────────────────────── */
  useEffect(() => {
    if (summary && open) {
      try {
        localStorage.setItem(storageKey, summary);
      } catch {
        /* ignore */
      }
    }
  }, [summary, storageKey, open]);

  /* ── reset UI state (NOT summary) when closed ───────────────────────────── */
  useEffect(() => {
    if (!open) {
      setRefinementInput("");
      setError("");
      setViewMode("preview");
      setCopied(false);
    }
  }, [open]);

  /* ── escape key ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── init editor when entering edit mode or after API update ────────────── */
  useEffect(() => {
    if (viewMode === "edit" && editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(summary);
      lastSnapshot.current = editorRef.current.innerHTML;
      undoStack.current = [];
      redoStack.current = [];
      try {
        const r = document.createRange();
        const s = window.getSelection();
        r.selectNodeContents(editorRef.current);
        r.collapse(false);
        s?.removeAllRanges();
        s?.addRange(r);
      } catch {
        /* ignore */
      }
      editorRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, summaryVer]);

  /* ── API: generate summary ──────────────────────────────────────────────── */
  const generateSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agent/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as Record<string, string>;
        throw new Error(d.error || "Failed to generate summary");
      }
      const d = (await res.json()) as { summary: string };
      setSummary(d.summary);
      setSummaryVer((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  /* ── API: refine ────────────────────────────────────────────────────────── */
  const handleRefinement = async () => {
    if (!refinementInput.trim() || refining) return;
    setRefining(true);
    setError("");
    const currentMd = getLatestMarkdown();
    try {
      const res = await fetch("/api/agent/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          currentSummary: currentMd,
          refinementRequest: refinementInput.trim(),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as Record<string, string>;
        throw new Error(d.error || "Failed to refine summary");
      }
      const d = (await res.json()) as { summary: string };
      setSummary(d.summary);
      setSummaryVer((v) => v + 1);
      setRefinementInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refine summary");
    } finally {
      setRefining(false);
    }
  };

  /* ── helpers ────────────────────────────────────────────────────────────── */

  const getLatestMarkdown = (): string => {
    if (viewMode === "edit" && editorRef.current) {
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      setSummary(md);
      return md;
    }
    return summary;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleClose = useCallback(() => {
    if (viewMode === "edit" && editorRef.current) {
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      try {
        localStorage.setItem(`silo-summary-${chatId || "default"}`, md);
      } catch {
        /* ignore */
      }
    }
    onClose();
  }, [viewMode, chatId, onClose]);

  const switchToPreview = () => {
    if (editorRef.current) {
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      setSummary(md);
    }
    setViewMode("preview");
  };

  const pushUndo = useCallback(() => {
    if (editorRef.current) {
      const snap = editorRef.current.innerHTML;
      if (snap !== lastSnapshot.current) {
        undoStack.current.push(lastSnapshot.current);
        if (undoStack.current.length > 100) undoStack.current.shift();
        redoStack.current = [];
        lastSnapshot.current = snap;
      }
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (!editorRef.current || undoStack.current.length === 0) return;
    redoStack.current.push(editorRef.current.innerHTML);
    const prev = undoStack.current.pop()!;
    editorRef.current.innerHTML = prev;
    lastSnapshot.current = prev;
    editorRef.current.focus();
  }, []);

  const handleRedo = useCallback(() => {
    if (!editorRef.current || redoStack.current.length === 0) return;
    undoStack.current.push(editorRef.current.innerHTML);
    const next = redoStack.current.pop()!;
    editorRef.current.innerHTML = next;
    lastSnapshot.current = next;
    editorRef.current.focus();
  }, []);

  const execCmd = useCallback((cmd: string, value?: string) => {
    pushUndo();
    document.execCommand(cmd, false, value ?? "");
    editorRef.current?.focus();
  }, [pushUndo]);

  const handleEditorInput = useCallback(() => {
    pushUndo();
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (editorRef.current) {
        const md = htmlToMarkdown(editorRef.current.innerHTML);
        setSummary(md);
      }
    }, 1500);
  }, [pushUndo]);

  const handleCopy = useCallback(async () => {
    try {
      const md =
        viewMode === "edit" && editorRef.current
          ? htmlToMarkdown(editorRef.current.innerHTML)
          : summary;
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }, [summary, viewMode]);

  /* ── PDF download ───────────────────────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    const md =
      viewMode === "edit" && editorRef.current
        ? htmlToMarkdown(editorRef.current.innerHTML)
        : summary;
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;
      const container = document.createElement("div");
      container.style.cssText =
        'padding:40px 48px;max-width:800px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;background:#fff';
      container.innerHTML = markdownToPdfHtml(md);
      document.body.appendChild(container);
      await html2pdf()
        .set({
          margin: [12, 16, 12, 16],
          filename: `chat-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();
      document.body.removeChild(container);
    } catch {
      setError("Failed to generate PDF. Downloading markdown instead.");
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-summary-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }, [summary, downloading, viewMode]);

  const handleRefinementKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleRefinement();
    }
  };

  if (!open) return null;

  /* ── theme vars ─────────────────────────────────────────────────────────── */
  const bg = themeVars["--at-bg"] || "#ffffff";
  const borderColor = themeVars["--at-border"] || "rgba(0,0,0,0.08)";
  const sendBg = themeVars["--at-send-bg"] || "#111111";
  const sendText = themeVars["--at-send-text"] || "#ffffff";
  const muted = themeVars["--at-muted"] || "rgba(0,0,0,0.42)";
  const accent = themeVars["--at-accent"] || "rgba(0,0,0,0.06)";
  const inputBg = themeVars["--at-input-bg"] || "#ffffff";

  /* solid toolbar background derived from page bg */
  const toolbarBg = bg === "#ffffff" ? "#f0f0f0" : bg.startsWith("rgba") ? "#f0f0f0" : bg;

  const TEXT_COLORS = [
    "#000000", "#434343", "#666666", "#999999",
    "#B80000", "#DB3E00", "#FCCB00", "#008B02",
    "#006B76", "#1273DE", "#004DCF", "#5300EB",
    "#EB144C", "#F78DA7", "#9900EF", "#A0522D",
    "#ffffff", "#ABB8C3",
  ];

  const HIGHLIGHT_COLORS = [
    "#FFEAA7", "#FDCB6E", "#FAB1A0", "#FF7675",
    "#A29BFE", "#74B9FF", "#81ECEC", "#55EFC4",
    "#DFE6E9", "#FFEFD5", "#E8DAEF", "#D5F5E3",
    "#FADBD8", "#F9E79F", "#AED6F1", "#A3E4D7",
    "#F5CBA7", "#CCD1D1",
  ];

  /* ── CSS for the WYSIWYG editor ─────────────────────────────────────────── */
  const editorCss = `
    .swysi{color:${sendBg};font-size:14px;line-height:1.75;min-height:370px;outline:none;padding:20px 24px;cursor:text}
    .swysi:empty::before{content:"Start typing\u2026";color:${muted};pointer-events:none}
    .swysi h1{font-size:1.5rem;font-weight:700;margin:1.5rem 0 1rem;color:${sendBg}}
    .swysi h2{font-size:1.125rem;font-weight:600;margin:1.25rem 0 .75rem;color:${sendBg}}
    .swysi h3{font-size:1rem;font-weight:600;margin:1rem 0 .5rem;color:${sendBg}}
    .swysi p{margin:0 0 .75rem;line-height:1.75;opacity:.9}
    .swysi ul{list-style:disc;margin:0 0 .75rem;padding-left:1.25rem;opacity:.9}
    .swysi ol{list-style:decimal;margin:0 0 .75rem;padding-left:1.25rem;opacity:.9}
    .swysi li{margin:.375rem 0;line-height:1.75;padding-left:.25rem}
    .swysi blockquote{border-left:3px solid ${muted};padding-left:1rem;color:${muted};font-style:italic;margin:.75rem 0}
    .swysi code{background:${accent};padding:2px 6px;border-radius:4px;font-size:13px;font-family:ui-monospace,monospace;border:1px solid ${borderColor}}
    .swysi pre{background:${accent};padding:14px 16px;border-radius:12px;margin:.75rem 0;border:1px solid ${borderColor};overflow-x:auto}
    .swysi pre code{background:none;padding:0;border:none;font-size:13px;line-height:1.5}
    .swysi hr{border:none;border-top:1px solid ${borderColor};margin:1.25rem 0}
    .swysi a{color:${sendBg};text-decoration:underline;text-underline-offset:2px}
    .swysi strong{font-weight:600;color:${sendBg}}
    .swysi em{font-style:italic}
    .swysi del,.swysi s,.swysi strike{text-decoration:line-through}
    .swysi>*:first-child{margin-top:0}
    .swysi>*:last-child{margin-bottom:0}
  `;

  /* ── modal JSX ──────────────────────────────────────────────────────────── */
  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <style>{editorCss}</style>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: bg,
          border: `1px solid ${borderColor}`,
          maxHeight: "calc(100vh - 4rem)",
          boxShadow: `0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px ${borderColor}`,
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-6"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: sendBg }}>Chat Summary</h2>
              <p className="text-[11px]" style={{ color: muted }}>
                {loading ? "Generating\u2026" : refining ? "Refining\u2026" : "AI-generated summary of your conversation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary && !loading && (
              <div className="flex h-8 rounded-lg p-0.5" style={{ background: accent, border: `1px solid ${borderColor}` }}>
                <button type="button" onClick={() => viewMode === "edit" ? switchToPreview() : setViewMode("preview")} className="rounded-md px-3 text-[11px] font-medium transition-all" style={{ background: viewMode === "preview" ? sendBg : "transparent", color: viewMode === "preview" ? sendText : muted }}>Preview</button>
                <button type="button" onClick={() => setViewMode("edit")} className="rounded-md px-3 text-[11px] font-medium transition-all" style={{ background: viewMode === "edit" ? sendBg : "transparent", color: viewMode === "edit" ? sendText : muted }}>Edit</button>
              </div>
            )}
            <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-80" style={{ color: muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 300 }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-20 sm:px-6">
              <div className="relative mb-6">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-current border-t-transparent" style={{ color: sendBg, opacity: 0.3 }} />
                <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-current" style={{ color: sendBg, animationDuration: "0.8s" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: sendBg }}>Preparing summary&hellip;</p>
              <p className="mt-1 text-xs" style={{ color: muted }}>Analyzing {messages.length} messages</p>
            </div>
          ) : error && !summary ? (
            <div className="flex flex-col items-center justify-center px-5 py-20 text-center sm:px-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: sendBg }}>{error}</p>
              <button type="button" onClick={() => void generateSummary()} className="mt-4 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:opacity-90" style={{ background: sendBg, color: sendText }}>Try Again</button>
            </div>
          ) : viewMode === "edit" ? (
            /* ── WYSIWYG Edit Mode ───────────────────────────────────────── */
            <div className="flex flex-col">
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5" style={{ background: toolbarBg, borderColor }}>
                {/* Undo / Redo */}
                <TBtn muted={muted} label="Undo (Ctrl+Z)" onClick={handleUndo} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>} />
                <TBtn muted={muted} label="Redo (Ctrl+Y)" onClick={handleRedo} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Text formatting */}
                <TBtn muted={muted} label="Bold (Ctrl+B)" onClick={() => execCmd("bold")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>} />
                <TBtn muted={muted} label="Italic (Ctrl+I)" onClick={() => execCmd("italic")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>} />
                <TBtn muted={muted} label="Underline (Ctrl+U)" onClick={() => execCmd("underline")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>} />
                <TBtn muted={muted} label="Strikethrough" onClick={() => execCmd("strikethrough")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3h6"/><path d="M12 15a3 3 0 1 1-3-3"/><line x1="4" y1="12" x2="20" y2="12"/></svg>} />
                <TBtn muted={muted} label="Superscript" onClick={() => execCmd("superscript")} icon={<span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>X<sup style={{ fontSize: 7 }}>2</sup></span>} />
                <TBtn muted={muted} label="Subscript" onClick={() => execCmd("subscript")} icon={<span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>X<sub style={{ fontSize: 7 }}>2</sub></span>} />
                <TDiv borderColor={borderColor} />
                {/* Colors */}
                <TColorBtn label="Text Color" muted={muted} borderColor={borderColor} activeBg={toolbarBg} colors={TEXT_COLORS} onSelect={(c) => { if (c) execCmd("foreColor", c); else execCmd("removeFormat"); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M9.5 4h5l4 12H5.5z" fill="none"/><path d="M7 16l5-12 5 12" /></svg>} />
                <TColorBtn label="Highlight Color" muted={muted} borderColor={borderColor} activeBg={toolbarBg} colors={HIGHLIGHT_COLORS} onSelect={(c) => { if (c) execCmd("hiliteColor", c); else execCmd("removeFormat"); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(252,203,0,0.3)" stroke="currentColor"/><path d="M7 16l5-12 5 12" /><path d="M4 20h16"/></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Headings */}
                <TBtn muted={muted} label="Heading 1" onClick={() => execCmd("formatBlock", "H1")} icon={<span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>H1</span>} />
                <TBtn muted={muted} label="Heading 2" onClick={() => execCmd("formatBlock", "H2")} icon={<span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>H2</span>} />
                <TBtn muted={muted} label="Heading 3" onClick={() => execCmd("formatBlock", "H3")} icon={<span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>H3</span>} />
                <TBtn muted={muted} label="Paragraph" onClick={() => execCmd("formatBlock", "P")} icon={<span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>{"\u00B6"}</span>} />
                <TDiv borderColor={borderColor} />
                {/* Lists */}
                <TBtn muted={muted} label="Bullet List" onClick={() => execCmd("insertUnorderedList")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>} />
                <TBtn muted={muted} label="Numbered List" onClick={() => execCmd("insertOrderedList")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Alignment */}
                <TBtn muted={muted} label="Align Left" onClick={() => execCmd("justifyLeft")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>} />
                <TBtn muted={muted} label="Align Center" onClick={() => execCmd("justifyCenter")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>} />
                <TBtn muted={muted} label="Align Right" onClick={() => execCmd("justifyRight")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Indent / Outdent */}
                <TBtn muted={muted} label="Decrease Indent" onClick={() => execCmd("outdent")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>} />
                <TBtn muted={muted} label="Increase Indent" onClick={() => execCmd("indent")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Block elements & links */}
                <TBtn muted={muted} label="Blockquote" onClick={() => execCmd("formatBlock", "BLOCKQUOTE")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>} />
                <TBtn muted={muted} label="Insert Link" onClick={() => { const url = prompt("Enter URL:"); if (url) execCmd("createLink", url); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
                <TBtn muted={muted} label="Horizontal Rule" onClick={() => execCmd("insertHorizontalRule")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>} />
                <TDiv borderColor={borderColor} />
                {/* Clear formatting */}
                <TBtn muted={muted} label="Clear Formatting" onClick={() => execCmd("removeFormat")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="3" y1="21" x2="21" y2="3" /></svg>} />
              </div>
              <div ref={editorRef} contentEditable suppressContentEditableWarning className="swysi flex-1" onInput={handleEditorInput} style={{ background: inputBg }} />
            </div>
          ) : (
            /* ── Preview Mode ────────────────────────────────────────────── */
            <div className="px-5 py-5 sm:px-6" style={{ color: sendBg }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 text-[14px] leading-7 last:mb-0" style={{ color: sendBg, opacity: 0.9 }}>{children}</p>,
                  h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold first:mt-0" style={{ color: sendBg }}>{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-3 mt-5 text-lg font-semibold first:mt-0" style={{ color: sendBg }}>{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0" style={{ color: sendBg }}>{children}</h3>,
                  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1.5 [&>li]:leading-7" style={{ color: sendBg, opacity: 0.9 }}>{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5 [&>li]:leading-7" style={{ color: sendBg, opacity: 0.9 }}>{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: sendBg }}>{children}</strong>,
                  em: ({ children }) => <em className="italic" style={{ color: sendBg, opacity: 0.8 }}>{children}</em>,
                  code: ({ children, className }) => {
                    if (className?.includes("language-")) {
                      return <code className="block overflow-x-auto rounded-xl px-4 py-3.5 font-mono text-[13px] leading-6" style={{ background: accent, color: sendBg, border: `1px solid ${borderColor}` }}>{children}</code>;
                    }
                    return <code className="rounded-md px-1.5 py-0.5 font-mono text-[13px]" style={{ background: accent, color: sendBg, border: `1px solid ${borderColor}` }}>{children}</code>;
                  },
                  pre: ({ children }) => <div className="mb-3 last:mb-0">{children}</div>,
                  blockquote: ({ children }) => <blockquote className="mb-3 border-l-[3px] pl-4 italic" style={{ borderColor: muted, color: muted }}>{children}</blockquote>,
                  hr: () => <hr className="my-5" style={{ borderColor }} />,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2 transition-colors" style={{ color: sendBg }}>{children}</a>,
                  table: ({ children }) => <div className="mb-3 overflow-x-auto rounded-xl" style={{ border: `1px solid ${borderColor}` }}><table className="min-w-full text-sm">{children}</table></div>,
                  th: ({ children }) => <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: `1px solid ${borderColor}`, background: accent, color: muted }}>{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2.5" style={{ borderBottom: `1px solid ${borderColor}`, color: sendBg, opacity: 0.8 }}>{children}</td>,
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Error toast */}
        {error && summary && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:mx-6" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button type="button" onClick={() => setError("")} className="ml-auto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {summary && !loading && (
          <div className="shrink-0 px-5 pb-4 pt-3 sm:px-6" style={{ borderTop: `1px solid ${borderColor}` }}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-xl" style={{ background: inputBg, border: `1.5px solid ${borderColor}` }}>
                <input ref={refinementRef} type="text" value={refinementInput} onChange={(e) => setRefinementInput(e.target.value)} onKeyDown={handleRefinementKeyDown} placeholder="Ask for changes\u2026 e.g. 'Make it more concise'" disabled={refining} className="flex-1 border-0 bg-transparent px-4 py-2.5 text-[13px] outline-none placeholder:opacity-50 disabled:opacity-50" style={{ color: sendBg, caretColor: sendBg }} />
                <button type="button" onClick={() => void handleRefinement()} disabled={!refinementInput.trim() || refining} className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30" style={{ background: sendBg, color: sendText }}>
                  {refining ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void generateSummary()} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80" style={{ border: `1px solid ${borderColor}`, color: muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Regenerate
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void handleCopy()} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80" style={{ border: `1px solid ${borderColor}`, color: muted }}>
                  {copied ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button type="button" onClick={() => void handleDownload()} disabled={downloading} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[11px] font-medium transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60" style={{ background: sendBg, color: sendText }}>
                  {downloading ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                  {downloading ? "Generating\u2026" : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HTML \u2194 Markdown converters                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function htmlToMarkdown(html: string): string {
  if (!html?.trim()) return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;
  if (!root) return "";
  return walkNode(root).replace(/\n{3,}/g, "\n\n").trim();
}

function walkNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const kids = () => Array.from(el.childNodes).map(walkNode).join("");

  switch (tag) {
    case "b": case "strong": return `**${kids()}**`;
    case "i": case "em": return `*${kids()}*`;
    case "s": case "del": case "strike": return `~~${kids()}~~`;
    case "u": return kids();
    case "h1": return `# ${kids()}\n\n`;
    case "h2": return `## ${kids()}\n\n`;
    case "h3": return `### ${kids()}\n\n`;
    case "h4": return `#### ${kids()}\n\n`;
    case "p": return `${kids()}\n\n`;
    case "div": { const c = kids(); return c.endsWith("\n") ? c : c + "\n"; }
    case "br": return "\n";
    case "ul": return Array.from(el.children).map((li) => `- ${walkNode(li).trim()}`).join("\n") + "\n\n";
    case "ol": return Array.from(el.children).map((li, i) => `${i + 1}. ${walkNode(li).trim()}`).join("\n") + "\n\n";
    case "li": return kids();
    case "blockquote": { const lines = kids().trim().split("\n").filter(Boolean); return lines.map((l) => `> ${l}`).join("\n") + "\n\n"; }
    case "code": { if (el.parentElement?.tagName.toLowerCase() === "pre") return el.textContent ?? ""; return "`" + kids() + "`"; }
    case "pre": return "```\n" + (el.textContent ?? "").trim() + "\n```\n\n";
    case "a": return `[${kids()}](${el.getAttribute("href") ?? ""})`;
    case "hr": return "\n---\n\n";
    case "span": return kids();
    default: return kids();
  }
}

function markdownToEditorHtml(md: string): string {
  if (!md?.trim()) return "<p><br></p>";
  let html = md;

  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (_: string, code: string) => {
    const escaped = code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    codeBlocks.push(`<pre><code>${escaped}</code></pre>`);
    return `\n%%CB${codeBlocks.length - 1}%%\n`;
  });

  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^---$/gm, "<hr>");

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>");
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");

  html = html.replace(/((?:^- .+\n?)+)/gm, (match: string) => {
    const items = match.trim().split("\n").map((l: string) => `<li>${l.replace(/^- /, "")}</li>`).join("");
    return `<ul>${items}</ul>\n`;
  });

  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (match: string) => {
    const items = match.trim().split("\n").map((l: string) => `<li>${l.replace(/^\d+\.\s/, "")}</li>`).join("");
    return `<ol>${items}</ol>\n`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  codeBlocks.forEach((block, i) => { html = html.replace(`%%CB${i}%%`, block); });

  const lines = html.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^<(h[1-6]|ul|ol|blockquote|hr|pre|p|div)/.test(t)) { out.push(t); }
    else { out.push(`<p>${t}</p>`); }
  }
  return out.join("\n") || "<p><br></p>";
}

function markdownToPdfHtml(md: string): string {
  let html = md;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/^### (.+)$/gm, '<h3 style="margin:18px 0 8px;font-size:16px;font-weight:600;color:#1a1a1a">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin:22px 0 10px;font-size:18px;font-weight:600;color:#1a1a1a">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin:28px 0 12px;font-size:22px;font-weight:700;color:#1a1a1a">$1</h1>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #d1d5db;padding-left:16px;color:#6b7280;font-style:italic;margin:12px 0">$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:10px 0 10px 20px;padding:0;list-style:disc">$1</ul>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline">$1</a>');
  html = html.replace(/^(?!<[hbulodpa]|<hr|<li|<code|<blockquote)(.+)$/gm, '<p style="margin:8px 0;line-height:1.7;color:#374151">$1</p>');
  html = html.replace(/\n{2,}/g, "\n");
  return html;
}
