"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "~/constants/routes";
import { authClient } from "~/server/auth/client";

import { Spinner } from "./spinner";

// TODO: This is a temporary auth guard. It should be replaced with a more robust solution.
// TODO: It can be done at each component level and Spinner will act locally.
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: auth, isPending: loading } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !auth?.session) {
      router.push(ROUTES.LOGIN);
    }
  }, [auth, loading, router]);

  if (loading) {
    return (
      <section className="flex h-screen flex-col items-center justify-center">
        <Spinner className="text-primary" />
      </section>
    );
  }

  if (!auth?.session) {
    return;
  }

  return children;
}
