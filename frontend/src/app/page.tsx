import Link from "next/link";
import { BrandMark, GoogleIcon } from "@/components/ui/icons";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10">
      <div className="w-full max-w-[336px]">
        {/* Brand lockup sits directly above the card */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <BrandMark size={20} />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            Pyramid
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-card)]">
          <h1 className="text-center text-[17px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            Let&apos;s get back on track
          </h1>
          <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-nowrap text-[var(--text-muted)]">
            Enter your email below to login to your account.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/tasks"
              className="flex h-9 w-full items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[13px] font-medium text-[var(--btn-primary-fg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
            >
              Continue as Guest
            </Link>

            <button
              type="button"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
            >
              <GoogleIcon size={15} />
              Login with Google
            </button>
          </div>
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
      </div>
    </main>
  );
}
