"use client";

import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { MoreHorizontalIcon, PriorityIcon, TrashIcon } from "@/components/ui/icons";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string }[] = [
  { id: "none", label: "No Priority", color: "var(--priority-none)" },
  { id: "urgent", label: "Urgent", color: "var(--priority-urgent)" },
  { id: "high", label: "High", color: "var(--priority-high)" },
  { id: "medium", label: "Medium", color: "var(--priority-medium)" },
  { id: "low", label: "Low", color: "var(--priority-low)" },
];

/**
 * The "···" menu on every task row and board card. Exposes the operations the
 * API supports — move between columns, change priority, delete.
 */
export function RowActions({
  label,
  status,
  priority,
  onStatusChange,
  onPriorityChange,
  onDelete,
  showStatus = true,
}: {
  label: string;
  status?: string;
  priority?: Priority;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: Priority) => void;
  onDelete: () => void;
  showStatus?: boolean;
}) {
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Actions for ${label}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        <MoreHorizontalIcon size={15} />
      </MenuTrigger>

      <MenuContent align="end" width={168}>
        {showStatus && onStatusChange ? (
          <>
            <MenuLabel>Move to</MenuLabel>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem
                key={option}
                selected={status === option}
                onSelect={() => onStatusChange(option)}
              >
                {option}
              </MenuItem>
            ))}
            <MenuSeparator />
          </>
        ) : null}

        {onPriorityChange ? (
          <>
            <MenuLabel>Priority</MenuLabel>
            {PRIORITY_OPTIONS.map((option) => (
              <MenuItem
                key={option.id}
                selected={priority === option.id}
                onSelect={() => onPriorityChange(option.id)}
                icon={
                  <span style={{ color: option.color }}>
                    <PriorityIcon level={option.id} size={13} />
                  </span>
                }
              >
                <span style={{ color: option.color }}>{option.label}</span>
              </MenuItem>
            ))}
            <MenuSeparator />
          </>
        ) : null}

        <MenuItem
          onSelect={onDelete}
          icon={<TrashIcon size={13} />}
          className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
        >
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
