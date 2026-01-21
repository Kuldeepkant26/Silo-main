import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error as unknown as Error);
  });
};

export const getInitials = (name: string) => {
  const names = name.split(" ");

  if (names.length === 1) {
    return names[0]?.charAt(0).toUpperCase();
  }

  return (
    (names[0] ? names[0].charAt(0).toUpperCase() : "") +
    (names[names.length - 1]
      ? names[names?.length - 1]?.charAt(0).toUpperCase()
      : "")
  );
};
