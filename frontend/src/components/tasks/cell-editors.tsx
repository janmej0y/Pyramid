"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarAdd } from "@/components/ui/avatar";
import { PriorityChip } from "@/components/ui/chips";
import { CalendarIcon, CheckIcon, PriorityIcon } from "@/components/ui/icons";
import { DatePicker } from "@/components/tasks/date-picker";
import { api, type ApiMember } from "@/lib/api";
import { cn, formatDateLong } from "@/lib/utils";
import type { Member, Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string }[] = [
  { id: "none", label: "No Priority", color: "var(--priority-none)" },
  { id: "urgent", label: "Urgent", color: "var(--priority-urgent)" },
  { id: "high", label: "High", color: "var(--priority-high)" },
  { id: "medium", label: "Medium", color: "var(--priority-medium)" },
  { id: "low", label: "Low", color: "var(--priority-low)" },
];

const popoverClass =
  "absolute z-50 mt-1 animate-[menu-in_120ms_ease-out] rounded-xl border " +
  "border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]";

/** Shared open/close-on-outside-click behaviour for the three cell editors. */
function useCellPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}

/** Click the priority cell to change it, rather than hunting in the ··· menu. */
export function PriorityCell({
  priority,
  onChange,
}: {
  priority: Priority;
  onChange: (next: Priority) => void;
}) {
  const { open, setOpen, ref } = useCellPopover();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change priority"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mx-1 rounded px-1 py-0.5 transition-colors hover:bg-[var(--hover)]"
      >
        <PriorityChip priority={priority} />
      </button>

      {open ? (
        <div role="menu" className={cn(popoverClass, "left-0 w-[150px]")}>
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={priority === option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--hover)]"
              style={{ color: option.color }}
            >
              <PriorityIcon level={option.id} size={13} />
              <span className="flex-1">{option.label}</span>
              {priority === option.id ? (
                <CheckIcon size={13} className="text-[var(--text)]" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Click the members cell to assign or unassign people. */
export function MembersCell({
  members,
  onChange,
  size = "sm",
}: {
  members: Member[];
  onChange: (memberIds: string[]) => void;
  size?: "xs" | "sm";
}) {
  const { open, setOpen, ref } = useCellPopover();
  const [people, setPeople] = useState<ApiMember[]>([]);

  // Fetched on first open so a long list doesn't load with every row.
  useEffect(() => {
    if (!open || people.length > 0) return;
    let cancelled = false;
    api
      .listUsers()
      .then((list) => {
        if (!cancelled) setPeople(list);
      })
      .catch(() => {
        // Leaves the list empty; the popover shows its empty state.
      });
    return () => {
      cancelled = true;
    };
  }, [open, people.length]);

  function toggle(id: string) {
    const current = members.map((m) => m.id);
    onChange(
      current.includes(id)
        ? current.filter((m) => m !== id)
        : [...current, id],
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Assign members"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded px-0.5 py-0.5 transition-colors hover:bg-[var(--hover)]"
      >
        {members.length > 0 ? (
          members.map((member) => (
            <Avatar
              key={member.id}
              name={member.name}
              src={member.avatar}
              size={size}
            />
          ))
        ) : (
          <AvatarAdd size={size} />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(popoverClass, "left-0 max-h-[220px] w-[190px] overflow-y-auto")}
        >
          {people.length === 0 ? (
            <p className="px-2 py-1.5 text-[12px] text-[var(--text-muted)]">
              Loading…
            </p>
          ) : (
            people.map((person) => {
              const active = members.some((m) => m.id === person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={active}
                  onClick={() => toggle(person.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
                >
                  <Avatar name={person.name} src={person.avatar} size="xs" />
                  <span className="flex-1 truncate">{person.name}</span>
                  {active ? <CheckIcon size={13} /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Click the due-date cell to open a calendar. */
export function DueDateCell({
  dueDate,
  onChange,
  align = "left",
}: {
  dueDate: string;
  onChange: (iso: string) => void;
  align?: "left" | "right";
}) {
  const { open, setOpen, ref } = useCellPopover();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change due date"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mx-1 flex items-center gap-1 rounded px-1 py-0.5 text-[12.5px] text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
      >
        {dueDate ? (
          formatDateLong(dueDate)
        ) : (
          <span className="flex items-center gap-1 text-[var(--text-subtle)]">
            <CalendarIcon size={12} />
            Set date
          </span>
        )}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-1 animate-[menu-in_120ms_ease-out]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <DatePicker
            value={dueDate ? new Date(dueDate) : new Date()}
            onChange={(date) => {
              onChange(date.toISOString());
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
