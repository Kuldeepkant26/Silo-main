"use client";

import { useEffect, useState } from "react";

import Cookies from "js-cookie";
import { useTranslations } from "next-intl";

import type { Locale } from "~/i18n/config";
import { DEFAULT_LOCALE } from "~/i18n/config";
import { getLocaleFromCookie, setLocaleCookie } from "~/lib/locale";
import { Icons } from "./icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
};

export function AuthLanguageSwitcher() {
  const t = useTranslations();
  const [currentLocale, setCurrentLocale] = useState<Locale>(DEFAULT_LOCALE);

  // Read the cookie only on the client after mount to avoid SSR mismatch
  useEffect(() => {
    const cookie = (Cookies?.get("locale") ?? DEFAULT_LOCALE) as Locale;
    setCurrentLocale(cookie);
  }, []);

  const handleChange = (newLang: string) => {
    const locale = newLang as Locale;
    if (locale !== getLocaleFromCookie()) {
      setLocaleCookie(locale);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <Select onValueChange={handleChange} value={currentLocale}>
      <SelectTrigger className="w-auto gap-1.5 border-none bg-transparent shadow-none px-2 py-1 h-auto text-sm text-muted-foreground hover:text-foreground focus:ring-0">
        <Icons.language className="h-3.5 w-3.5 shrink-0" />
        <SelectValue>{LOCALE_LABELS[currentLocale]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="en">{t("english")}</SelectItem>
        <SelectItem value="es">{t("spanish")}</SelectItem>
        <SelectItem value="ca">{t("catalan")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

