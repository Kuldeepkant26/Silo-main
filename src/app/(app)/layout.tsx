import type { ReactNode } from "react";

import { AuthGuard } from "~/components/auth-guard";
import { Logo } from "~/components/logo";
import { OrganizationGuard } from "~/components/organization-guard";
import { SidebarNav } from "~/components/sidebar-nav";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-background">
      <aside className="hidden w-[280px] flex-col bg-white dark:bg-muted p-5 md:flex sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        <header className="flex flex-col gap-y-3 h-full">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex-1 bg-gray-100 rounded-xl py-4 px-[18px] text-center">
              <Logo width={48} height={48} className="mx-auto" />
            </div>
          </div>

          <SidebarNav />
        </header>
      </aside>
      <main className="relative flex w-full flex-1 flex-col overflow-y-auto">
        <AuthGuard>
          <OrganizationGuard>{children}</OrganizationGuard>
        </AuthGuard>
      </main>
    </div>
  );
}
