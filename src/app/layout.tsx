import "~/styles/globals.css";

import type { ReactNode } from "react";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "Silo",
    template: "%s | Silo",
  },
  description: "TBD",
  authors: [
    {
      name: "silo",
      url: "https://bysilo.com",
    },
  ],
  creator: "shadcn",
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          geist.variable,
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
