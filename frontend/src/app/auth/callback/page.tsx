"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandMark } from "@/components/ui/icons";

/** Maps the API's fragment error codes onto something a person can act on. */
const MESSAGES: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  access_denied: "Sign-in was cancelled.",
  invalid_state: "That sign-in link expired. Please try again.",
  signin_failed: "Google sign-in failed. Please try again.",
};

/**
 * Lands the Google OAuth redirect.
 *
 * The API returns the session token in the URL fragment, which browsers never
 * send to a server — keeping it out of access logs and Referer headers. This
 * page reads it, exchanges it for a session, and scrubs it from the address bar.
 *
 * Everything happens in an effect rather than during render: the fragment is
 * only readable on the client, so deriving state from it while rendering makes
 * the server and client disagree, which React rejects as a hydration mismatch.
 */
export default function AuthCallbackPage() {
  const { loginWithToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // StrictMode double-invokes effects; the fragment must only be consumed once.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const failure = params.get("error");

    // Clear the fragment before anything async, so the token cannot be read
    // from the address bar or left behind in history.
    window.history.replaceState(null, "", window.location.pathname);

    if (failure || !token) {
      // Reading the fragment is exactly the "subscribe to an external system"
      // case the rule exempts — window.location does not exist during SSR, so
      // deriving this during render would desync server and client markup and
      // React would discard the tree (error #418). It runs once, guarded above.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(MESSAGES[failure ?? ""] ?? "Sign-in failed. Please try again.");
      return;
    }

    let cancelled = false;

    loginWithToken(token)
      .then(() => {
        if (!cancelled) router.replace("/tasks");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not start your session. Please try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithToken, router]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6">
      <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--text)]">
        <BrandMark size={22} />
        Pyramid
      </span>

      {error ? (
        <div className="flex flex-col items-center gap-3">
          <p role="alert" className="text-center text-[13px] text-[var(--danger-fg)]">
            {error}
          </p>
          <Link
            href="/"
            className="rounded-full border border-[var(--border)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <p role="status" className="text-[13px] text-[var(--text-muted)]">
          Signing you in…
        </p>
      )}
    </main>
  );
}
