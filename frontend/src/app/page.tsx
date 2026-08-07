import { LoginCard } from "@/components/auth/login-card";
import { BrandMark } from "@/components/ui/icons";

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

        <LoginCard />
      </div>
    </main>
  );
}
