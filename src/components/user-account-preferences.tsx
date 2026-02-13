import { useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import type { UiTheme } from "~/config/shared";
import type { Locale } from "~/i18n/config";
import { DEFAULT_LOCALE } from "~/i18n/config";
import { getLocaleFromCookie, setLocaleCookie } from "~/lib/locale";

import { Icons } from "./icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// ─── Modern Animated Theme Toggle (B&W, applies theme instantly) ─────────────
function ThemeToggle({
  value,
  onFormChange,
  onThemeApply,
}: {
  value: UiTheme;
  onFormChange: (theme: UiTheme) => void;
  onThemeApply: (theme: string) => void;
}) {
  const isDark = value === "dark";
  const toggleRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations();

  const applyTheme = useCallback(
    (newTheme: UiTheme) => {
      // Update both the form value AND apply the actual theme immediately
      onFormChange(newTheme);
      onThemeApply(newTheme);
    },
    [onFormChange, onThemeApply],
  );

  const handleToggle = useCallback(() => {
    const newTheme: UiTheme = isDark ? "light" : "dark";

    const btn = toggleRef.current;
    if (!btn) {
      applyTheme(newTheme);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Use View Transition API for circular spread
    if (document.startViewTransition) {
      document.documentElement.style.setProperty("--theme-toggle-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-toggle-y", `${y}px`);
      document.documentElement.style.setProperty(
        "--theme-toggle-radius",
        `${maxRadius}px`,
      );

      document.startViewTransition(() => {
        applyTheme(newTheme);
      });
    } else {
      applyTheme(newTheme);
    }
  }, [isDark, applyTheme]);

  return (
    <div className="flex items-center gap-3">
      <button
        ref={toggleRef}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
        onClick={handleToggle}
        className="theme-toggle-btn group relative inline-flex h-[2.4rem] w-[4.8rem] shrink-0 cursor-pointer items-center rounded-full transition-all duration-700 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{
          background: isDark ? "#111111" : "#e4e4e4",
          boxShadow: isDark
            ? "inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)"
            : "inset 0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.10)",
        }}
      >
        {/* Track decorations: stars for dark */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span
            className="absolute transition-all duration-700"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <span className="theme-star absolute h-[3px] w-[3px] rounded-full bg-white/90" style={{ left: 10, top: 8 }} />
            <span className="theme-star absolute h-[2px] w-[2px] rounded-full bg-white/70" style={{ left: 18, top: 14, animationDelay: "0.4s" }} />
            <span className="theme-star absolute h-[2px] w-[2px] rounded-full bg-white/60" style={{ left: 12, top: 24, animationDelay: "0.8s" }} />
            <span className="theme-star absolute h-[1.5px] w-[1.5px] rounded-full bg-white/50" style={{ left: 22, top: 7, animationDelay: "1.2s" }} />
            <span className="theme-star absolute h-[2px] w-[2px] rounded-full bg-white/40" style={{ left: 6, top: 16, animationDelay: "0.6s" }} />
          </span>
        </span>

        {/* Knob */}
        <span
          className="pointer-events-none relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
          style={{
            transform: isDark ? "translateX(40px)" : "translateX(5px)",
            background: isDark ? "#ffffff" : "#1a1a1a",
            boxShadow: isDark
              ? "0 0 14px 3px rgba(255,255,255,0.2), 0 0 5px 1px rgba(255,255,255,0.4)"
              : "0 0 14px 3px rgba(0,0,0,0.12), 0 0 5px 1px rgba(0,0,0,0.2)",
          }}
        >
          {/* Moon craters */}
          <span
            className="absolute transition-all duration-700"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? "scale(1)" : "scale(0)",
            }}
          >
            <span className="absolute h-[5px] w-[5px] rounded-full bg-black/10" style={{ top: 6, left: 14 }} />
            <span className="absolute h-[3px] w-[3px] rounded-full bg-black/10" style={{ top: 14, left: 8 }} />
            <span className="absolute h-[2px] w-[2px] rounded-full bg-black/8" style={{ top: 10, left: 18 }} />
          </span>

          {/* Sun rays */}
          <span
            className="absolute inset-[-6px] transition-all duration-700"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? "scale(0) rotate(-180deg)" : "scale(1) rotate(0deg)",
            }}
          >
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 origin-center"
                style={{ transform: `rotate(${i * 45}deg)` }}
              >
                <span
                  className="absolute h-[2px] w-[4px] rounded-full bg-black/60"
                  style={{ top: "-17px", left: "-2px" }}
                />
              </span>
            ))}
          </span>

          {/* Center icon */}
          <span
            className="absolute inset-0 flex items-center justify-center transition-all duration-700"
            style={{ transform: isDark ? "rotate(0deg)" : "rotate(360deg)" }}
          >
            <span
              className="absolute transition-all duration-500"
              style={{
                opacity: isDark ? 1 : 0,
                transform: isDark ? "scale(1) rotate(0deg)" : "scale(0) rotate(90deg)",
              }}
            >
              <Icons.moon className="h-3.5 w-3.5 text-black/60" />
            </span>
            <span
              className="absolute transition-all duration-500"
              style={{
                opacity: isDark ? 0 : 1,
                transform: isDark ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
              }}
            >
              <Icons.sun className="h-3.5 w-3.5 text-white/80" />
            </span>
          </span>
        </span>
      </button>

      {/* Animated label */}
      <span
        className="relative h-5 overflow-hidden text-xs font-medium text-muted-foreground"
        style={{ minWidth: "2.5rem" }}
      >
        <span
          className="absolute inset-0 flex items-center transition-all duration-500"
          style={{
            transform: isDark ? "translateY(0)" : "translateY(-100%)",
            opacity: isDark ? 1 : 0,
          }}
        >
          {t("dark")}
        </span>
        <span
          className="absolute inset-0 flex items-center transition-all duration-500"
          style={{
            transform: isDark ? "translateY(100%)" : "translateY(0)",
            opacity: isDark ? 0 : 1,
          }}
        >
          {t("light")}
        </span>
      </span>
    </div>
  );
}

export function UserAccountPreferences() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  const currentLocale = (Cookies?.get("locale") ?? DEFAULT_LOCALE) as Locale;

  const handleLanguageChange = (newLang: string) => {
    const locale = newLang as Locale;
    if (locale !== getLocaleFromCookie()) {
      setLocaleCookie(locale);

      toast.success(t("account_preferences_success_title"), {
        description: t("account_preferences_language_success_description"),
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">
          {t("application_preferences")}
        </CardTitle>
        <CardDescription>
          {t("application_preferences_description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Language Section ─────────────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icons.language className="h-4 w-4 text-primary" />
                </div>
                {t("language")}
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {t("account_preferences_language_description")}
              </p>
            </div>
            <Select
              onValueChange={handleLanguageChange}
              defaultValue={currentLocale}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("english")}</SelectItem>
                <SelectItem value="es">{t("spanish")}</SelectItem>
                <SelectItem value="ca">{t("catalan")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Theme Section ────────────────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  {theme === "dark" ? (
                    <Icons.moon className="h-4 w-4 text-primary" />
                  ) : (
                    <Icons.sun className="h-4 w-4 text-primary" />
                  )}
                </div>
                {t("theme")}
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {t("account_preferences_theme_description")}
              </p>
            </div>
            <ThemeToggle
              value={(theme ?? "light") as UiTheme}
              onFormChange={() => {}}
              onThemeApply={setTheme}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
