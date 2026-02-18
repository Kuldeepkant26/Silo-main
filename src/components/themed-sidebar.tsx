"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AGENT_THEMES, type AgentThemeId } from "~/app/(app)/agent/page";

// Inject the scoped style rules once
const THEME_STYLE_ID = "sidebar-agent-theme-style";
const THEME_CSS = `
  aside[data-agent-theme] button,
  aside[data-agent-theme] a {
    color: var(--at-muted) !important;
  }
  aside[data-agent-theme] button:hover,
  aside[data-agent-theme] a:hover {
    background: var(--at-accent) !important;
    color: var(--at-send-bg) !important;
  }
  aside[data-agent-theme] button[data-active="true"],
  aside[data-agent-theme] a[data-active="true"],
  aside[data-agent-theme] .bg-primary {
    background: var(--at-send-bg) !important;
    color: var(--at-send-text) !important;
  }
  aside[data-agent-theme] .bg-muted,
  aside[data-agent-theme] .dark\\:bg-accent {
    background: var(--at-accent) !important;
  }
  aside[data-agent-theme] h4 {
    color: inherit !important;
  }
  aside[data-agent-theme] .text-muted-foreground {
    color: var(--at-muted) !important;
  }
  aside[data-agent-theme] .text-foreground\\/80 {
    color: var(--at-muted) !important;
  }
`;

function applyThemeToEl(el: HTMLElement, themeId: AgentThemeId | null, isAgentPage: boolean) {
  const theme = AGENT_THEMES.find((t) => t.id === themeId) ?? AGENT_THEMES[0]!;
  const shouldApply = isAgentPage && themeId;

  if (shouldApply) {
    el.setAttribute("data-agent-theme", themeId!);
    el.style.background = theme.vars["--at-bg"];
    el.style.borderRight = "";
    el.style.color = theme.vars["--at-send-bg"];
    el.classList.remove("bg-white", "dark:bg-muted");
    // Set CSS custom properties on the element
    for (const [key, value] of Object.entries(theme.vars)) {
      el.style.setProperty(key, value);
    }
  } else {
    el.removeAttribute("data-agent-theme");
    el.style.background = "";
    el.style.borderRight = "";
    el.style.color = "";
    if (!el.classList.contains("bg-white")) {
      el.classList.add("bg-white");
    }
    // Remove CSS custom properties
    for (const key of Object.keys(AGENT_THEMES[0]!.vars)) {
      el.style.removeProperty(key);
    }
  }
}

export function ThemedSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAgentPage = pathname === "/agent";
  const asideRef = useRef<HTMLElement>(null);

  // Apply theme styles post-hydration via DOM manipulation
  useEffect(() => {
    // Inject global style block once
    if (!document.getElementById(THEME_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = THEME_STYLE_ID;
      style.textContent = THEME_CSS;
      document.head.appendChild(style);
    }

    const el = asideRef.current;
    if (!el) return;

    const readAndApply = () => {
      let stored: AgentThemeId | null = null;
      try {
        stored = (localStorage.getItem("silo-agent-theme") as AgentThemeId) ?? "snow";
      } catch {
        stored = "snow";
      }
      applyThemeToEl(el, stored, isAgentPage);
    };

    readAndApply();

    const handleThemeChange = (e: Event) => {
      const id = (e as CustomEvent<AgentThemeId>).detail;
      applyThemeToEl(el, id, isAgentPage);
    };

    window.addEventListener("silo-agent-theme-change", handleThemeChange);
    window.addEventListener("storage", readAndApply);

    return () => {
      window.removeEventListener("silo-agent-theme-change", handleThemeChange);
      window.removeEventListener("storage", readAndApply);
    };
  }, [isAgentPage]);

  return (
    <aside
      ref={asideRef}
      className="hidden w-[280px] flex-col p-5 md:flex sticky top-0 h-screen overflow-y-auto flex-shrink-0 transition-colors duration-300 bg-white dark:bg-muted border-r border-gray-200 dark:border-gray-700"
    >
      {children}
    </aside>
  );
}
