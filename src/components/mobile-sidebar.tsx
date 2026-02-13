"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Logo } from "~/components/logo";
import { SidebarNav } from "~/components/sidebar-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-muted border border-border shadow-md hover:bg-gray-50 dark:hover:bg-accent transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        <SheetHeader className="p-5 pb-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 bg-gray-100 dark:bg-background rounded-xl py-4 px-[18px] text-center">
              <Logo width={48} height={48} className="mx-auto" />
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5 pt-3">
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
