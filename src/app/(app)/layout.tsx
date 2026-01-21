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
    <div className="flex min-h-screen">
      <aside className="hidden w-48 flex-col border-r pt-3 md:flex">
        <header className="flex h-full flex-col items-center justify-center gap-y-3">
          <Logo width={48} height={48} className="mr-auto ml-6" />

          <SidebarNav />
        </header>
      </aside>
      <main className="relative flex w-full flex-1 flex-col overflow-hidden">
        <AuthGuard>
          <OrganizationGuard>{children}</OrganizationGuard>
        </AuthGuard>
      </main>
    </div>
  );
}
