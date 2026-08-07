import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:opacity-90 border border-transparent",
  outline:
    "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover)]",
  ghost:
    "bg-transparent text-[var(--text-muted)] border border-transparent hover:bg-[var(--hover)] hover:text-[var(--text)]",
  danger:
    "bg-[var(--danger-bg)] text-[var(--danger-fg)] border border-transparent hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5 rounded-md",
  md: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  lg: "h-9 px-4 text-[13px] gap-2 rounded-lg",
  icon: "h-8 w-8 rounded-md justify-center",
  "icon-sm": "h-7 w-7 rounded-md justify-center",
};

/**
 * Shared button. Every actionable control in the app funnels through this so
 * heights, radii, and focus rings stay identical across views.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "outline", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
