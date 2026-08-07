import { CalendarIcon, PriorityIcon, TagIcon } from "@/components/ui/icons";
import { cn, formatDateShort } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const priorityMeta: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "var(--priority-urgent)" },
  high: { label: "High", color: "var(--priority-high)" },
  medium: { label: "Medium", color: "var(--priority-medium)" },
  low: { label: "Low", color: "var(--priority-low)" },
  none: { label: "No Priority", color: "var(--priority-none)" },
};

/** Icon + coloured label, as rendered in the Priority column. */
export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  const meta = priorityMeta[priority];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", className)}
      style={{ color: meta.color }}
    >
      <PriorityIcon level={priority} size={13} />
      {meta.label}
    </span>
  );
}

/** Outlined label pill with a tag glyph, used on board cards and task details. */
export function LabelChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-[3px] text-[11px] text-[var(--text-muted)]">
      <TagIcon size={11} />
      {label}
    </span>
  );
}

/** Red-tinted due date pill from the board cards ("29 Jul"). */
export function DueChip({ date }: { date: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--due-bg)] px-1.5 py-[3px] text-[11px] font-medium text-[var(--due-fg)]">
      <CalendarIcon size={11} />
      {formatDateShort(date)}
    </span>
  );
}

/** Status dot + label ("Backlog") from the task details panel. */
export function StatusChip({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)]">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: "var(--status-backlog)" }}
      />
      {status}
    </span>
  );
}
