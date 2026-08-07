import { cn, initials } from "@/lib/utils";

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-7 w-7 text-[11px]",
  lg: "h-8 w-8 text-[12px]",
  xl: "h-11 w-11 text-[15px]",
} as const;

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
};

/**
 * Avatar with a deterministic gradient fallback. The design shows both photo
 * avatars and initial-only avatars ("CN") side by side in the members column.
 */
export function Avatar({ name, src, size = "sm", className }: AvatarProps) {
  const base = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none overflow-hidden",
    sizeMap[size],
    className,
  );

  if (src) {
    // Avatars are decorative next to the visible member name.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn(base, "object-cover")} />;
  }

  return (
    <span
      className={cn(base, "bg-[var(--hover)] text-[var(--text-muted)] border border-[var(--border)]")}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

/** The dashed "+" placeholder shown in the Members column. */
export function AvatarAdd({ size = "sm" }: { size?: keyof typeof sizeMap }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "border border-dashed border-[var(--border-strong)] text-[var(--text-subtle)]",
        sizeMap[size],
      )}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  );
}
