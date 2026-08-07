"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Client-side route guard. Sends anonymous visitors back to the login screen
 * and renders nothing until the session is resolved, so protected content never
 * flashes before the redirect.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--app-bg)]">
        <span className="text-[13px] text-[var(--text-muted)]">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
