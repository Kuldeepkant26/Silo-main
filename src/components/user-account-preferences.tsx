import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { UiTheme } from "~/config/shared";
import type { Locale } from "~/i18n/config";
import type { PreferencesFormValues } from "~/lib/validators/preferences";
import { DEFAULT_LOCALE } from "~/i18n/config";
import { getLocaleFromCookie, setLocaleCookie } from "~/lib/locale";
import { preferencesFormSchema } from "~/lib/validators/preferences";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
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
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        {t("theme")}
      </label>
      <div className="flex items-center gap-4">
        <button
          ref={toggleRef}
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          onClick={handleToggle}
          className="theme-toggle-btn group relative inline-flex h-[2.6rem] w-[5rem] shrink-0 cursor-pointer items-center rounded-full shadow-lg transition-all duration-700 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{
            background: isDark ? "#111111" : "#e8e8e8",
            boxShadow: isDark
              ? "inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)"
              : "inset 0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          {/* Track decorations: stars for dark, dots for light */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            {/* Stars (dark mode) */}
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

          {/* Knob — the animated sun/moon circle */}
          <span
            className="pointer-events-none relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
            style={{
              transform: isDark ? "translateX(42px)" : "translateX(4px)",
              background: isDark ? "#ffffff" : "#1a1a1a",
              boxShadow: isDark
                ? "0 0 18px 4px rgba(255,255,255,0.25), 0 0 6px 1px rgba(255,255,255,0.5)"
                : "0 0 18px 4px rgba(0,0,0,0.15), 0 0 6px 1px rgba(0,0,0,0.3)",
            }}
          >
            {/* Moon craters (dark mode) */}
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

            {/* Sun rays (light mode) — 8 rays that rotate in */}
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
                  style={{
                    transform: `rotate(${i * 45}deg)`,
                  }}
                >
                  <span
                    className="absolute h-[2px] w-[5px] rounded-full bg-black/70"
                    style={{
                      top: "-18px",
                      left: "-2.5px",
                    }}
                  />
                </span>
              ))}
            </span>

            {/* Center icon */}
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-700"
              style={{
                transform: isDark ? "rotate(0deg)" : "rotate(360deg)",
              }}
            >
              {/* Moon icon */}
              <span
                className="absolute transition-all duration-500"
                style={{
                  opacity: isDark ? 1 : 0,
                  transform: isDark ? "scale(1) rotate(0deg)" : "scale(0) rotate(90deg)",
                }}
              >
                <Icons.moon className="h-4 w-4 text-black/70" />
              </span>
              {/* Sun icon */}
              <span
                className="absolute transition-all duration-500"
                style={{
                  opacity: isDark ? 0 : 1,
                  transform: isDark ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
                }}
              >
                <Icons.sun className="h-4 w-4 text-white/90" />
              </span>
            </span>
          </span>
        </button>

        {/* Animated label */}
        <span
          className="relative overflow-hidden text-sm font-medium text-muted-foreground"
          style={{ minWidth: "3rem" }}
        >
          <span
            className="inline-block transition-all duration-500"
            style={{
              transform: isDark ? "translateY(0)" : "translateY(-100%)",
              opacity: isDark ? 1 : 0,
              position: isDark ? "relative" : "absolute",
            }}
          >
            {t("dark")}
          </span>
          <span
            className="inline-block transition-all duration-500"
            style={{
              transform: isDark ? "translateY(100%)" : "translateY(0)",
              opacity: isDark ? 0 : 1,
              position: isDark ? "absolute" : "relative",
            }}
          >
            {t("light")}
          </span>
        </span>
      </div>
    </div>
  );
}

export function UserAccountPreferences() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const initialValues: PreferencesFormValues = useMemo(
    () => ({
      language: (Cookies?.get("locale") ?? DEFAULT_LOCALE) as Locale,
      theme: theme as UiTheme,
    }),
    [theme],
  );

  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: initialValues,
  });

  const watchedValues = preferencesForm.watch();

  // Only track language changes for the save button (theme is applied instantly)
  useEffect(() => {
    const hasLanguageChange =
      watchedValues.language !== initialValues.language;
    setHasChanges(hasLanguageChange);
  }, [watchedValues.language, initialValues.language]);

  const onPreferencesSubmit = async (data: PreferencesFormValues) => {
    setIsLoading(true);

    try {
      if (data.language !== getLocaleFromCookie()) {
        setLocaleCookie(data.language);

        toast.success(t("account_preferences_success_title"), {
          description: t("account_preferences_language_success_description"),
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      toast.success(t("account_preferences_success_title"), {
        description: t("account_preferences_success_description"),
      });

      preferencesForm.reset(data);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error(t("error"), {
        description: t("account_preferences_error_description"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">
          {t("application_preferences")}
        </CardTitle>
        <CardDescription>
          {t("application_preferences_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...preferencesForm}>
          <form
            onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={preferencesForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icons.language className="h-4 w-4" />
                      {t("language")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t("english")}</SelectItem>
                        <SelectItem value="es">{t("spanish")}</SelectItem>
                        <SelectItem value="ca">{t("catalan")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={preferencesForm.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ThemeToggle
                        value={field.value}
                        onFormChange={field.onChange}
                        onThemeApply={setTheme}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="min-w-32"
              >
                {isLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <Icons.checkCircle className="h-4 w-4" />
                    {t("save_preferences")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
