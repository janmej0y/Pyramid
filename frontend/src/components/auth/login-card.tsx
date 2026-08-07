"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { GoogleIcon } from "@/components/ui/icons";

export function LoginCard() {
  const { loginAsGuest } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuest() {
    setPending(true);
    setError(null);
    try {
      await loginAsGuest("Dexter");
      router.push("/tasks");
    } catch {
      setError("Could not start a guest session. Is the API running?");
      setPending(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-card)]">
        <h1 className="text-center text-[17px] font-semibold tracking-[-0.01em] text-[var(--text)]">
          Let&apos;s get back on track
        </h1>
        <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-nowrap text-[var(--text-muted)]">
          Enter your email below to login to your account.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGuest}
            disabled={pending}
            className="flex h-9 w-full items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[13px] font-medium text-[var(--btn-primary-fg)] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          >
            {pending ? "Starting session…" : "Continue as Guest"}
          </button>

          <button
            type="button"
            disabled
            title="Google sign-in is not part of this assessment scope"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon size={15} />
            Login with Google
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-center text-[11.5px] text-[var(--danger-fg)]">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mx-auto mt-5 max-w-[240px] text-center text-[11.5px] leading-[1.6] text-[var(--text-muted)]">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="underline underline-offset-2 hover:text-[var(--text)]">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-2 hover:text-[var(--text)]">
          Privacy Policy
        </Link>
      </p>
    </>
  );
}
