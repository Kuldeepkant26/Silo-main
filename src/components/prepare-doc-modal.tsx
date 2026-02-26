"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocMessage {
  role: "user" | "assistant";
  content: string;
}

interface PrepareDocModalProps {
  open: boolean;
  onClose: () => void;
  messages: DocMessage[];
  themeVars: Record<string, string>;
  chatId?: string;
}

type ModalStep = "template" | "editor";
type ViewMode = "preview" | "edit";

interface ArchivedDoc {
  id: string;
  templateId: string;
  templateName: string;
  content: string;
  customPrompt?: string;
  chatId?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

interface DocTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

// ─── Document Templates ───────────────────────────────────────────────────────

function getTemplates(sendBg: string, muted: string, t: (key: string) => string): DocTemplate[] {
  const s = (d: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );

  return [
    {
      id: "nda",
      name: t("doc_tpl_nda"),
      description: t("doc_tpl_nda_desc"),
      badge: t("doc_badge_legal"),
      badgeColor: "#7c3aed",
      icon: s("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
    },
    {
      id: "contract",
      name: t("doc_tpl_service_contract"),
      description: t("doc_tpl_service_contract_desc"),
      badge: t("doc_badge_legal"),
      badgeColor: "#7c3aed",
      icon: s("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8"),
    },
    {
      id: "proposal",
      name: t("doc_tpl_business_proposal"),
      description: t("doc_tpl_business_proposal_desc"),
      badge: t("doc_badge_business"),
      badgeColor: "#0891b2",
      icon: s("M3 3h18v18H3z|M3 9h18|M9 21V9"),
    },
    {
      id: "report",
      name: t("doc_tpl_report"),
      description: t("doc_tpl_report_desc"),
      badge: t("doc_badge_business"),
      badgeColor: "#0891b2",
      icon: s("M18 20V10|M12 20V4|M6 20v-6"),
    },
    {
      id: "minutes",
      name: t("doc_tpl_meeting_minutes"),
      description: t("doc_tpl_meeting_minutes_desc"),
      badge: t("doc_badge_meetings"),
      badgeColor: "#059669",
      icon: s("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75"),
    },
    {
      id: "email",
      name: t("doc_tpl_professional_email"),
      description: t("doc_tpl_professional_email_desc"),
      badge: t("doc_badge_comms"),
      badgeColor: "#d97706",
      icon: s("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6"),
    },
    {
      id: "legal",
      name: t("doc_tpl_legal_brief"),
      description: t("doc_tpl_legal_brief_desc"),
      badge: t("doc_badge_legal"),
      badgeColor: "#7c3aed",
      icon: s("M3 6h18|M7 12h10|M10 18h4"),
    },
    {
      id: "terms-of-service",
      name: t("doc_tpl_terms_of_service"),
      description: t("doc_tpl_terms_of_service_desc"),
      badge: t("doc_badge_legal"),
      badgeColor: "#7c3aed",
      icon: s("M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"),
    },
    {
      id: "sow",
      name: t("doc_tpl_statement_of_work"),
      description: t("doc_tpl_statement_of_work_desc"),
      badge: t("doc_badge_projects"),
      badgeColor: "#0891b2",
      icon: s("M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2|M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2|M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2|M9 12h6|M9 16h4"),
    },
    {
      id: "custom",
      name: t("doc_tpl_custom"),
      description: t("doc_tpl_custom_desc"),
      badge: t("doc_badge_custom"),
      badgeColor: "#e11d48",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
  ];
}

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function TBtn({
  icon, label, onClick, muted, active, activeBg,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  muted: string; active?: boolean; activeBg?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all hover:opacity-70"
      style={{ color: muted, background: active ? (activeBg || "rgba(0,0,0,0.1)") : undefined }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );
}

function TColorBtn({
  label, muted, borderColor, activeBg, icon, colors, onSelect,
}: {
  label: string; muted: string; borderColor: string; activeBg: string;
  icon: React.ReactNode; colors: string[]; onSelect: (c: string) => void;
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

function TDiv({ borderColor }: { borderColor: string }) {
  return <div className="mx-1 h-4 w-px shrink-0" style={{ background: borderColor }} />;
}

// ─── Word count / reading time ────────────────────────────────────────────────

function docStats(md: string): { words: number; readMin: number } {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return { words, readMin: Math.max(1, Math.round(words / 200)) };
}

// ─── HTML ↔ Markdown converters (shared logic from chat-summary-modal) ────────

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
  html = html.replace(/^(?!<[hbulodpa]|<hr|<li|<blockquote)(.+)$/gm, '<p style="margin:8px 0;line-height:1.7;color:#374151">$1</p>');
  html = html.replace(/\n{2,}/g, "\n");
  return html;
}

function markdownToWordHtml(md: string, title: string): string {
  const body = markdownToPdfHtml(md);
  return `<!DOCTYPE html>
<html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: "Calibri", Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
  h1 { font-size: 18pt; font-weight: bold; margin: 24pt 0 10pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 8pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 14pt 0 6pt; }
  p { margin: 6pt 0; }
  ul, ol { margin: 8pt 0; padding-left: 20pt; }
  li { margin: 3pt 0; }
  blockquote { border-left: 3pt solid #d1d5db; padding-left: 10pt; color: #6b7280; font-style: italic; margin: 10pt 0; }
  hr { border: none; border-top: 1pt solid #e5e7eb; margin: 16pt 0; }
  code { font-family: "Courier New", monospace; font-size: 9pt; background: #f3f4f6; padding: 1pt 3pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  th, td { border: 1pt solid #d1d5db; padding: 6pt 8pt; font-size: 10pt; }
  th { background: #f9fafb; font-weight: bold; }
</style>
</head>
<body>${body}</body>
</html>`;
}

// ─── Archive helpers ────────────────────────────────────────────────────────

const ARCHIVE_KEY = "silo-doc-archive";

function loadArchive(): ArchivedDoc[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) return JSON.parse(raw) as ArchivedDoc[];
  } catch { /* ignore */ }
  return [];
}

function saveArchive(docs: ArchivedDoc[]): void {
  try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(docs)); } catch { /* ignore */ }
}

function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── AI Suggestion chip ───────────────────────────────────────────────────────

const QUICK_SUGGESTION_KEYS = [
  "doc_suggestion_concise",
  "doc_suggestion_summary",
  "doc_suggestion_formal",
  "doc_suggestion_placeholders",
  "doc_suggestion_expand",
  "doc_suggestion_grammar",
  "doc_suggestion_toc",
  "doc_suggestion_persuasive",
];

// ─── PrepareDocModal ──────────────────────────────────────────────────────────

export function PrepareDocModal({
  open,
  onClose,
  messages,
  themeVars,
  chatId,
}: PrepareDocModalProps) {
  const t = useTranslations();
  /* ── theme ──────────────────────────────────────────────────────────────── */
  const bg = themeVars["--at-bg"] || "#ffffff";
  const borderColor = themeVars["--at-border"] || "rgba(0,0,0,0.08)";
  const sendBg = themeVars["--at-send-bg"] || "#111111";
  const sendText = themeVars["--at-send-text"] || "#ffffff";
  const muted = themeVars["--at-muted"] || "rgba(0,0,0,0.42)";
  const accent = themeVars["--at-accent"] || "rgba(0,0,0,0.06)";
  const inputBg = themeVars["--at-input-bg"] || "#ffffff";
  const toolbarBg = bg === "#ffffff" ? "#f0f0f0" : bg.startsWith("rgba") ? "#f0f0f0" : bg;

  const TEMPLATES = useMemo(() => getTemplates(sendBg, muted, t), [sendBg, muted, t]);

  /* ── state ──────────────────────────────────────────────────────────────── */
  const [step, setStep] = useState<ModalStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<DocTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [doc, setDoc] = useState("");
  const [docVer, setDocVer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivedDocs, setArchivedDocs] = useState<ArchivedDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  /* ── refs ───────────────────────────────────────────────────────────────── */
  const editorRef = useRef<HTMLDivElement>(null);
  const refinementRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSnapshot = useRef<string>("");

  const storageKey = `silo-prepare-doc-${chatId || "default"}`;
  const storageTemplateKey = `silo-prepare-doc-template-${chatId || "default"}`;

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => docStats(doc), [doc]);

  /* ── persistence ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      // load archive
      setArchivedDocs(loadArchive());
      try {
        const savedDoc = localStorage.getItem(storageKey);
        const savedTpl = localStorage.getItem(storageTemplateKey);
        if (savedDoc && savedTpl) {
          const tpl: DocTemplate = JSON.parse(savedTpl) as DocTemplate;
          // recover icon from templates list
          const found = TEMPLATES.find((t) => t.id === tpl.id);
          setSelectedTemplate(found ?? tpl);
          setDoc(savedDoc);
          setDocVer((v) => v + 1);
          setStep("editor");
        }
      } catch {
        /* ignore */
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (doc && open && selectedTemplate) {
      try {
        localStorage.setItem(storageKey, doc);
        localStorage.setItem(storageTemplateKey, JSON.stringify({ id: selectedTemplate.id, name: selectedTemplate.name }));
      } catch { /* ignore */ }
      // auto-update archive entry for current doc
      if (activeDocId) {
        setArchivedDocs((prev) => {
          const exists = prev.find((d) => d.id === activeDocId);
          const wc = doc.trim().split(/\s+/).filter(Boolean).length;
          if (exists) {
            const updated = prev.map((d) =>
              d.id === activeDocId ? { ...d, content: doc, updatedAt: new Date().toISOString(), wordCount: wc } : d
            );
            saveArchive(updated);
            return updated;
          }
          const newEntry: ArchivedDoc = {
            id: activeDocId,
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            content: doc,
            customPrompt: customPrompt || undefined,
            chatId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: wc,
          };
          const updated = [newEntry, ...prev];
          saveArchive(updated);
          return updated;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, open, selectedTemplate, storageKey, storageTemplateKey, activeDocId]);

  /* ── reset on close ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setRefinementInput("");
      setError("");
      setViewMode("preview");
      setCopied(false);
      setShowSuggestions(false);
      setArchiveOpen(false);
      setPendingTemplate(null);
    }
  }, [open]);

  /* ── escape key ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── sync editor when mode / version changes ────────────────────────────── */
  useEffect(() => {
    if (viewMode === "edit" && editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(doc);
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
      } catch { /* ignore */ }
      editorRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, docVer]);

  /* ── API: generate document ─────────────────────────────────────────────── */
  const generateDocument = useCallback(async (tpl: DocTemplate, docId?: string) => {
    if (!tpl) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agent/prepare-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          templateId: tpl.id,
          templateName: tpl.name,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as Record<string, string>;
        throw new Error(d.error || "Failed to generate document");
      }
      const d = (await res.json()) as { document: string };
      setDoc(d.document);
      setDocVer((v) => v + 1);
      // save to archive
      const usedId = docId ?? activeDocId ?? generateDocId();
      if (docId) setActiveDocId(usedId);
      const wc = d.document.trim().split(/\s+/).filter(Boolean).length;
      const entry: ArchivedDoc = {
        id: usedId,
        templateId: tpl.id,
        templateName: tpl.name,
        content: d.document,
        customPrompt: customPrompt.trim() || undefined,
        chatId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: wc,
      };
      setArchivedDocs((prev) => {
        const updated = [entry, ...prev.filter((a) => a.id !== usedId)];
        saveArchive(updated);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("doc_failed_generate"));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, customPrompt, activeDocId, chatId]);

  /* ── API: refine document ───────────────────────────────────────────────── */
  const handleRefinement = async (overrideInput?: string) => {
    const req = (overrideInput ?? refinementInput).trim();
    if (!req || refining || !selectedTemplate) return;
    setRefining(true);
    setAiThinking(true);
    setError("");
    setShowSuggestions(false);
    const currentMd = getLatestMarkdown();
    try {
      const res = await fetch("/api/agent/prepare-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          currentDoc: currentMd,
          refinementRequest: req,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as Record<string, string>;
        throw new Error(d.error || "Failed to refine document");
      }
      const d = (await res.json()) as { document: string };
      setDoc(d.document);
      setDocVer((v) => v + 1);
      setRefinementInput("");
      if (viewMode === "edit") setViewMode("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("doc_failed_refine"));
    } finally {
      setRefining(false);
      setAiThinking(false);
    }
  };

  /* ── Proceed from template step ─────────────────────────────────────────── */
  const handleProceed = async () => {
    if (!pendingTemplate) return;
    const tpl = pendingTemplate;
    setSelectedTemplate(tpl);
    setStep("editor");
    setPendingTemplate(null);
    if (tpl.id === "custom") {
      // Empty page — no AI, just open blank editor
      const newId = generateDocId();
      setActiveDocId(newId);
      setDoc("");
      setDocVer((v) => v + 1);
      setViewMode("edit");
      return;
    }
    const newId = generateDocId();
    setActiveDocId(newId);
    await generateDocument(tpl, newId);
  };

  /* ── delete archived doc ─────────────────────────────────────────────────── */
  const handleDeleteArchived = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivedDocs((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      saveArchive(updated);
      return updated;
    });
  };

  /* ── restore archived doc ─────────────────────────────────────────────────── */
  const handleRestoreArchived = (archived: ArchivedDoc) => {
    const found = TEMPLATES.find((t) => t.id === archived.templateId);
    setSelectedTemplate(found ?? { id: archived.templateId, name: archived.templateName, description: "", icon: null });
    setDoc(archived.content);
    setDocVer((v) => v + 1);
    setActiveDocId(archived.id);
    setStep("editor");
    setViewMode("preview");
    setArchiveOpen(false);
  };

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const getLatestMarkdown = useCallback((): string => {
    if (viewMode === "edit" && editorRef.current) {
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      setDoc(md);
      return md;
    }
    return doc;
  }, [viewMode, doc]);

  const handleClose = useCallback(() => {
    if (viewMode === "edit" && editorRef.current) {
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      try { localStorage.setItem(storageKey, md); } catch { /* ignore */ }
    }
    onClose();
  }, [viewMode, storageKey, onClose]);

  const switchToPreview = () => {
    if (editorRef.current) { const md = htmlToMarkdown(editorRef.current.innerHTML); setDoc(md); }
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
      if (editorRef.current) { const md = htmlToMarkdown(editorRef.current.innerHTML); setDoc(md); }
    }, 1500);
  }, [pushUndo]);

  const handleCopy = useCallback(async () => {
    try {
      const md = viewMode === "edit" && editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : doc;
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setError(t("doc_failed_copy")); }
  }, [doc, viewMode]);

  /* ── Download PDF ───────────────────────────────────────────────────────── */
  const handleDownloadPdf = useCallback(async () => {
    if (downloading) return;
    setDownloading("pdf");
    const md = viewMode === "edit" && editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : doc;
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;
      const container = document.createElement("div");
      container.style.cssText = 'padding:40px 48px;max-width:800px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;background:#fff';
      container.innerHTML = markdownToPdfHtml(md);
      document.body.appendChild(container);
      const filename = `${selectedTemplate?.name.replace(/\s+/g, "-").toLowerCase() ?? "document"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await html2pdf()
        .set({
          margin: [12, 16, 12, 16],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();
      document.body.removeChild(container);
    } catch {
      setError(t("doc_pdf_fallback"));
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate?.name.replace(/\s+/g, "-").toLowerCase() ?? "document"}-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }, [downloading, doc, viewMode, selectedTemplate]);

  /* ── Download Word ──────────────────────────────────────────────────────── */
  const handleDownloadWord = useCallback(async () => {
    if (downloading) return;
    setDownloading("word");
    const md = viewMode === "edit" && editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : doc;
    try {
      const title = selectedTemplate?.name ?? "Document";
      const wordHtml = markdownToWordHtml(md, title);
      const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError(t("doc_failed_word"));
    } finally {
      setDownloading(null);
    }
  }, [downloading, doc, viewMode, selectedTemplate]);

  /* ── Print ──────────────────────────────────────────────────────────────── */
  const handlePrint = useCallback(() => {
    const md = viewMode === "edit" && editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : doc;
    const body = markdownToPdfHtml(md);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${selectedTemplate?.name ?? "Document"}</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;font-size:14px;line-height:1.7}h1{font-size:22px;font-weight:700}h2{font-size:18px;font-weight:600}h3{font-size:16px;font-weight:600}ul{padding-left:20px}li{margin:4px 0}blockquote{border-left:3px solid #d1d5db;padding-left:16px;color:#6b7280;font-style:italic}hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}@media print{body{padding:0}}</style>
    </head><body>${body}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  }, [doc, viewMode, selectedTemplate]);

  /* ── Change template ────────────────────────────────────────────────────── */
  const handleChangeTemplate = () => {
    setStep("template");
    setDoc("");
    setError("");
    setViewMode("preview");
    setCustomPrompt("");
    setPendingTemplate(null);
    setActiveDocId(null);
    try { localStorage.removeItem(storageKey); localStorage.removeItem(storageTemplateKey); } catch { /* ignore */ }
  };

  if (!open) return null;

  /* ── CSS for WYSIWYG editor ─────────────────────────────────────────────── */
  const editorCss = `
    .pdwysi{color:${sendBg};font-size:14px;line-height:1.75;min-height:340px;outline:none;padding:20px 24px;cursor:text}
    .pdwysi:empty::before{content:"Start typing\u2026";color:${muted};pointer-events:none}
    .pdwysi h1{font-size:1.5rem;font-weight:700;margin:1.5rem 0 1rem;color:${sendBg}}
    .pdwysi h2{font-size:1.125rem;font-weight:600;margin:1.25rem 0 .75rem;color:${sendBg}}
    .pdwysi h3{font-size:1rem;font-weight:600;margin:1rem 0 .5rem;color:${sendBg}}
    .pdwysi p{margin:0 0 .75rem;line-height:1.75;opacity:.9}
    .pdwysi ul{list-style:disc;margin:0 0 .75rem;padding-left:1.25rem;opacity:.9}
    .pdwysi ol{list-style:decimal;margin:0 0 .75rem;padding-left:1.25rem;opacity:.9}
    .pdwysi li{margin:.375rem 0;line-height:1.75;padding-left:.25rem}
    .pdwysi blockquote{border-left:3px solid ${muted};padding-left:1rem;color:${muted};font-style:italic;margin:.75rem 0}
    .pdwysi code{background:${accent};padding:2px 6px;border-radius:4px;font-size:13px;font-family:ui-monospace,monospace;border:1px solid ${borderColor}}
    .pdwysi pre{background:${accent};padding:14px 16px;border-radius:12px;margin:.75rem 0;border:1px solid ${borderColor};overflow-x:auto}
    .pdwysi pre code{background:none;padding:0;border:none;font-size:13px;line-height:1.5}
    .pdwysi hr{border:none;border-top:1px solid ${borderColor};margin:1.25rem 0}
    .pdwysi a{color:${sendBg};text-decoration:underline;text-underline-offset:2px}
    .pdwysi strong{font-weight:600;color:${sendBg}}
    .pdwysi em{font-style:italic}
    .pdwysi del,.pdwysi s,.pdwysi strike{text-decoration:line-through}
    .pdwysi>*:first-child{margin-top:0}
    .pdwysi>*:last-child{margin-bottom:0}
    @keyframes pd-thinking-pulse{0%,100%{opacity:.4}50%{opacity:1}}
    .pd-thinking-dot{animation:pd-thinking-pulse 1.2s ease-in-out infinite}
    .pd-thinking-dot:nth-child(2){animation-delay:.2s}
    .pd-thinking-dot:nth-child(3){animation-delay:.4s}
  `;

  const TEXT_COLORS = ["#000000","#434343","#666666","#999999","#B80000","#DB3E00","#FCCB00","#008B02","#006B76","#1273DE","#004DCF","#5300EB","#EB144C","#F78DA7","#9900EF","#A0522D","#ffffff","#ABB8C3"];
  const HIGHLIGHT_COLORS = ["#FFEAA7","#FDCB6E","#FAB1A0","#FF7675","#A29BFE","#74B9FF","#81ECEC","#55EFC4","#DFE6E9","#FFEFD5","#E8DAEF","#D5F5E3","#FADBD8","#F9E79F","#AED6F1","#A3E4D7","#F5CBA7","#CCD1D1"];

  /* ── Modal JSX ──────────────────────────────────────────────────────────── */
  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6"
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
          maxHeight: "calc(100vh - 3rem)",
          boxShadow: `0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px ${borderColor}`,
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3.5 sm:px-6"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3">
            {step === "editor" && selectedTemplate && (
              <button
                type="button"
                onClick={handleChangeTemplate}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all hover:opacity-70"
                style={{ background: accent, border: `1px solid ${borderColor}` }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
              </button>
            )}
            {step === "template" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent }}>
              {/* Document icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <line x1="8" y1="9" x2="16" y2="9" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
              </svg>
            </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold" style={{ color: sendBg }}>
                  {step === "template" ? t("doc_prepare_document") : (selectedTemplate?.name ?? t("doc_document"))}
                </h2>
              </div>
              <p className="text-[11px]" style={{ color: muted }}>
                {step === "template"
                  ? t("doc_choose_template")
                  : loading
                    ? t("doc_generating")
                    : refining
                      ? t("doc_applying_changes")
                      : `${stats.words} ${t("doc_words")} \u00B7 ~${stats.readMin} ${t("doc_min_read")}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "editor" && doc && !loading && (
              <div className="flex h-8 rounded-lg p-0.5" style={{ background: accent, border: `1px solid ${borderColor}` }}>
                <button
                  type="button"
                  onClick={() => viewMode === "edit" ? switchToPreview() : setViewMode("preview")}
                  className="rounded-md px-3 text-[11px] font-medium transition-all"
                  style={{ background: viewMode === "preview" ? sendBg : "transparent", color: viewMode === "preview" ? sendText : muted }}
                >
                  {t("doc_preview")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className="rounded-md px-3 text-[11px] font-medium transition-all"
                  style={{ background: viewMode === "edit" ? sendBg : "transparent", color: viewMode === "edit" ? sendText : muted }}
                >
                  {t("doc_edit")}
                </button>
              </div>
            )}
            {/* Archive toggle */}
            <button
              type="button"
              title="Archived documents"
              onClick={() => setArchiveOpen((o) => !o)}
              className="relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-all hover:opacity-80"
              style={{
                border: `1px solid ${borderColor}`,
                background: archiveOpen ? sendBg : "transparent",
                color: archiveOpen ? sendText : muted,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              <span className="hidden sm:inline">{t("doc_archive")}</span>
              {archivedDocs.length > 0 && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                  style={{ background: archiveOpen ? sendText : sendBg, color: archiveOpen ? sendBg : sendText }}
                >
                  {archivedDocs.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-80"
              style={{ color: muted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* ── Step indicator ───────────────────────────────────────────────── */}
        {step === "editor" && (
          <div className="shrink-0 flex items-center gap-2 px-5 pt-2.5 pb-0 sm:px-6">
            {[{ label: t("doc_step_template"), done: true }, { label: t("doc_step_generate"), done: false }].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <div className="h-px w-5" style={{ background: borderColor }} />}
                <div className="flex items-center gap-1">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: s.done ? sendBg : accent, color: s.done ? sendText : muted }}>
                    {s.done ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: s.done ? sendBg : muted }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 300 }}>

          {/* ── STEP 1: Template Selection ──────────────────────────────── */}
          {step === "template" && (
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {TEMPLATES.map((tpl) => {
                  const isSelected = pendingTemplate?.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setPendingTemplate(tpl)}
                      className="group relative flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                      style={{
                        border: `1.5px solid ${isSelected ? sendBg : borderColor}`,
                        background: isSelected ? `${sendBg}0d` : accent,
                        boxShadow: isSelected ? `0 0 0 3px ${sendBg}22` : undefined,
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div
                          className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: sendBg }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={sendText} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <div className="flex w-full items-start justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                          {tpl.icon}
                        </div>
                        {tpl.badge && !isSelected && (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `${tpl.badgeColor}18`, color: tpl.badgeColor }}>
                            {tpl.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold leading-tight" style={{ color: sendBg }}>{tpl.name}</p>
                        <p className="mt-0.5 text-[10px] leading-snug" style={{ color: muted }}>{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom prompt / additional context */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-medium" style={{ color: muted }}>
                  {t("doc_additional_instructions")} <span style={{ opacity: 0.5 }}>({t("doc_optional_applied")})</span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  placeholder='e.g. "This is for a SaaS product. Include GDPR clause and use formal UK English."'
                  className="w-full resize-none rounded-xl px-4 py-2.5 text-[13px] outline-none placeholder:opacity-40"
                  style={{ background: inputBg, border: `1.5px solid ${borderColor}`, color: sendBg, caretColor: sendBg }}
                />
              </div>

              {/* Proceed bar */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: accent, border: `1px solid ${borderColor}` }}>
                <p className="text-[11px]" style={{ color: muted }}>
                  {pendingTemplate
                    ? pendingTemplate.id === "custom"
                      ? <span>{t("doc_ready_custom", { name: pendingTemplate.name })}</span>
                      : <span>{t("doc_ready_generate", { name: pendingTemplate.name })}</span>
                    : <span style={{ opacity: 0.6 }}>{t("doc_select_template")}</span>}
                </p>
                <button
                  type="button"
                  disabled={!pendingTemplate}
                  onClick={() => void handleProceed()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ background: sendBg, color: sendText }}
                >
                  {pendingTemplate?.id === "custom" ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      {t("doc_open_editor")}
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" /></svg>
                      {t("doc_generate_with_ai")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Editor ──────────────────────────────────────────── */}
          {step === "editor" && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center px-5 py-20 sm:px-6">
                  <div className="relative mb-6">
                    <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-current border-t-transparent" style={{ color: sendBg, opacity: 0.3 }} />
                    <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-current" style={{ color: sendBg, animationDuration: "0.8s" }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: sendBg }}>{t("doc_generating_your", { name: selectedTemplate?.name ?? t("doc_document") })}</p>
                  <p className="mt-1 text-xs" style={{ color: muted }}>{t("doc_ai_analysing")}</p>
                  {messages.length > 0 && (
                    <p className="mt-0.5 text-[11px]" style={{ color: muted, opacity: 0.6 }}>{t("doc_using_messages", { count: messages.length })}</p>
                  )}
                </div>
              ) : error && !doc ? (
                <div className="flex flex-col items-center justify-center px-5 py-20 text-center sm:px-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: sendBg }}>{error}</p>
                  <button type="button" onClick={() => selectedTemplate && void generateDocument(selectedTemplate)} className="mt-4 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:opacity-90" style={{ background: sendBg, color: sendText }}>{t("doc_try_again")}</button>
                </div>
              ) : viewMode === "edit" ? (
                /* ── WYSIWYG Edit Mode ────────────────────────────────────── */
                <div className="flex flex-col">
                  <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5" style={{ background: toolbarBg, borderColor }}>
                    <TBtn muted={muted} label="Undo (Ctrl+Z)" onClick={handleUndo} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>} />
                    <TBtn muted={muted} label="Redo (Ctrl+Y)" onClick={handleRedo} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Bold" onClick={() => execCmd("bold")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>} />
                    <TBtn muted={muted} label="Italic" onClick={() => execCmd("italic")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>} />
                    <TBtn muted={muted} label="Underline" onClick={() => execCmd("underline")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>} />
                    <TBtn muted={muted} label="Strikethrough" onClick={() => execCmd("strikethrough")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3h6"/><path d="M12 15a3 3 0 1 1-3-3"/><line x1="4" y1="12" x2="20" y2="12"/></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TColorBtn label="Text Color" muted={muted} borderColor={borderColor} activeBg={toolbarBg} colors={TEXT_COLORS} onSelect={(c) => { if (c) execCmd("foreColor", c); else execCmd("removeFormat"); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><text x="4" y="17" fontFamily="serif" fontSize="17" fontWeight="700" fill="currentColor">A</text><rect x="2" y="20" width="20" height="3" rx="1" fill="#e53e3e"/></svg>} />
                    <TColorBtn label="Highlight" muted={muted} borderColor={borderColor} activeBg={toolbarBg} colors={HIGHLIGHT_COLORS} onSelect={(c) => { if (c) execCmd("hiliteColor", c); else execCmd("removeFormat"); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="22" height="22" rx="4" fill="#fcd34d" opacity="0.35"/><text x="5" y="18" fontFamily="serif" fontSize="17" fontWeight="700" fill="currentColor">a</text></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="H1" onClick={() => execCmd("formatBlock", "H1")} icon={<span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>H1</span>} />
                    <TBtn muted={muted} label="H2" onClick={() => execCmd("formatBlock", "H2")} icon={<span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>H2</span>} />
                    <TBtn muted={muted} label="H3" onClick={() => execCmd("formatBlock", "H3")} icon={<span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>H3</span>} />
                    <TBtn muted={muted} label="Paragraph" onClick={() => execCmd("formatBlock", "P")} icon={<span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>{"\u00B6"}</span>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Bullet List" onClick={() => execCmd("insertUnorderedList")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>} />
                    <TBtn muted={muted} label="Numbered List" onClick={() => execCmd("insertOrderedList")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Align Left" onClick={() => execCmd("justifyLeft")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>} />
                    <TBtn muted={muted} label="Align Center" onClick={() => execCmd("justifyCenter")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>} />
                    <TBtn muted={muted} label="Align Right" onClick={() => execCmd("justifyRight")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Decrease Indent" onClick={() => execCmd("outdent")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>} />
                    <TBtn muted={muted} label="Increase Indent" onClick={() => execCmd("indent")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Blockquote" onClick={() => execCmd("formatBlock", "BLOCKQUOTE")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>} />
                    <TBtn muted={muted} label="Insert Link" onClick={() => { const url = prompt("Enter URL:"); if (url) execCmd("createLink", url); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
                    <TBtn muted={muted} label="Horizontal Rule" onClick={() => execCmd("insertHorizontalRule")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>} />
                    <TDiv borderColor={borderColor} />
                    <TBtn muted={muted} label="Clear Formatting" onClick={() => execCmd("removeFormat")} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="3" y1="21" x2="21" y2="3" /></svg>} />
                  </div>
                  <div ref={editorRef} contentEditable suppressContentEditableWarning className="pdwysi flex-1" onInput={handleEditorInput} style={{ background: inputBg }} />
                </div>
              ) : (
                /* ── Preview Mode ─────────────────────────────────────────── */
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
                    {doc}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Archive side panel ──────────────────────────────────────────── */}
        {archiveOpen && (
          <div
            className="absolute inset-y-0 right-0 z-20 flex w-72 flex-col overflow-hidden rounded-r-2xl"
            style={{ background: bg, borderLeft: `1px solid ${borderColor}` }}
          >
            {/* Archive header */}
            <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                <span className="text-[13px] font-semibold" style={{ color: sendBg }}>{t("doc_archived_docs")}</span>
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: accent, color: muted }}>{archivedDocs.length}</span>
              </div>
              <button type="button" onClick={() => setArchiveOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: muted }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Archive list */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {archivedDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: accent }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: sendBg }}>{t("doc_no_archived")}</p>
                  <p className="mt-1 text-[11px]" style={{ color: muted, opacity: 0.6 }}>{t("doc_auto_save")}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {archivedDocs.map((ad) => {
                    const isActive = ad.id === activeDocId;
                    const date = new Date(ad.updatedAt);
                    const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div
                        key={ad.id}
                        className="group relative flex cursor-pointer flex-col gap-1 rounded-xl px-3 py-2.5 transition-all"
                        style={{
                          background: isActive ? `${sendBg}0d` : accent,
                          border: `1px solid ${isActive ? sendBg : borderColor}`,
                        }}
                        onClick={() => handleRestoreArchived(ad)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[11px] font-semibold leading-tight" style={{ color: sendBg }}>{ad.templateName}</span>
                          <button
                            type="button"
                            title="Delete"
                            onClick={(e) => handleDeleteArchived(ad.id, e)}
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                            style={{ color: muted }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: muted }}>{dateStr} {timeStr}</span>
                          <span className="text-[10px]" style={{ color: muted, opacity: 0.5 }}>·</span>
                          <span className="text-[10px]" style={{ color: muted }}>{ad.wordCount} words</span>
                        </div>
                        {ad.customPrompt && (
                          <p className="truncate text-[10px] italic" style={{ color: muted, opacity: 0.7 }}>{ad.customPrompt}</p>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full" style={{ height: "60%", background: sendBg }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Archive footer */}
            {archivedDocs.length > 0 && (
              <div className="shrink-0 px-3 py-2.5" style={{ borderTop: `1px solid ${borderColor}` }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t("doc_clear_confirm"))) {
                      setArchivedDocs([]);
                      saveArchive([]);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition-all hover:opacity-80"
                  style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  {t("doc_clear_all")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Error toast ─────────────────────────────────────────────────── */}
        {error && doc && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:mx-6" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button type="button" onClick={() => setError("")} className="ml-auto"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
          </div>
        )}

        {/* ── Footer (only in editor step with a doc) ──────────────────── */}
        {step === "editor" && doc && !loading && (
          <div className="shrink-0 px-5 pb-4 pt-3 sm:px-6" style={{ borderTop: `1px solid ${borderColor}` }}>

            {/* ── AI thinking indicator ───────────────────────────────── */}
            {aiThinking && (
              <div className="mb-2.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: accent, border: `1px solid ${borderColor}` }}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${sendBg}14` }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sendBg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <span style={{ color: muted }}>{t("doc_ai_updating")}</span>
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="pd-thinking-dot inline-block h-1 w-1 rounded-full" style={{ background: muted, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              </div>
            )}

            {/* ── Quick suggestion chips ──────────────────────────────── */}
            {showSuggestions && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {QUICK_SUGGESTION_KEYS.map((key) => {
                  const label = t(key);
                  return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setRefinementInput(label); setShowSuggestions(false); refinementRef.current?.focus(); }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                    style={{ background: accent, color: muted, border: `1px solid ${borderColor}` }}
                  >
                    {label}
                  </button>
                  );
                })}
              </div>
            )}

            {/* ── AI refinement bar ───────────────────────────────────── */}
            <div className="mb-3 flex items-center rounded-xl" style={{ background: inputBg, border: `1.5px solid ${borderColor}` }}>
              {/* Sparkle / AI icon */}
              <button
                type="button"
                title="Quick suggestions"
                onClick={() => setShowSuggestions((s) => !s)}
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all hover:opacity-70"
                style={{ background: showSuggestions ? sendBg : accent, color: showSuggestions ? sendText : muted }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                </svg>
              </button>
              <input
                ref={refinementRef}
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleRefinement(); } }}
                placeholder={t("doc_refinement_placeholder")}
                disabled={refining}
                className="flex-1 border-0 bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:opacity-40 disabled:opacity-50"
                style={{ color: sendBg, caretColor: sendBg }}
              />
              <button
                type="button"
                onClick={() => void handleRefinement()}
                disabled={!refinementInput.trim() || refining}
                className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30"
                style={{ background: sendBg, color: sendText }}
              >
                {refining
                  ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}
              </button>
            </div>

            {/* ── Action bar ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {/* Regenerate */}
                <button type="button" onClick={() => selectedTemplate && void generateDocument(selectedTemplate)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80" style={{ border: `1px solid ${borderColor}`, color: muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  {t("doc_regenerate")}
                </button>
                {/* Print */}
                <button type="button" onClick={handlePrint} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80" style={{ border: `1px solid ${borderColor}`, color: muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {t("doc_print")}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Copy */}
                <button type="button" onClick={() => void handleCopy()} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80" style={{ border: `1px solid ${borderColor}`, color: muted }}>
                  {copied
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>}
                  {copied ? t("doc_copied") : t("doc_copy")}
                </button>

                {/* Download Word */}
                <button
                  type="button"
                  onClick={() => void handleDownloadWord()}
                  disabled={!!downloading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-60"
                  style={{ border: `1px solid ${borderColor}`, color: muted }}
                >
                  {downloading === "word"
                    ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /></svg>}
                  {downloading === "word" ? t("doc_exporting") : t("doc_word")}
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={!!downloading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[11px] font-medium transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
                  style={{ background: sendBg, color: sendText }}
                >
                  {downloading === "pdf"
                    ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                  {downloading === "pdf" ? t("doc_generating_pdf") : t("doc_download_pdf")}
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
