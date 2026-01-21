"use client";

import type { Locale } from "~/i18n/config";
import { DEFAULT_LOCALE, LOCALES } from "~/i18n/config";

export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "locale" && LOCALES.includes(value as Locale)) {
      return value as Locale;
    }
  }

  return DEFAULT_LOCALE;
}
