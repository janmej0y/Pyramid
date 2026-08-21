"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  "fixed z-[100] animate-[menu-in_120ms_ease-out] rounded-xl border " +
  "border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]";

/**
 * Renders a cell popover into <body>, positioned against its trigger.
 *
 * Table rows sit inside a card with `overflow-hidden` (needed for its rounded
 * corners), which clipped these panels at the section boundary — a picker
 * opened on the last row of a group was cut in half. Escaping to the body also
 * means no ancestor stacking context can bury it.
 *
 * The panel flips above the trigger when there is not room below, and is
 * clamped to the viewport horizontally, so it stays fully visible wherever the
 * row happens to be.
 */
function CellPopover({
  anchorRef,
  className,
  children,
  align = "left",
  width,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
  align?: "left" | "right";
  width: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const a = anchor.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const margin = 8;

      let left = align === "right" ? a.right - width : a.left;
      left = Math.min(
        Math.max(margin, left),
        window.innerWidth - width - margin,
      );

      // Prefer below, flip above when there is more room there, and cap the
      // height to whichever side is used so the panel can never run off-screen.
      const below = window.innerHeight - a.bottom - 4 - margin;
      const above = a.top - 4 - margin;
      const flip = p.height > below && above > below;
      const room = Math.max(120, Math.floor(flip ? above : below));

      const height = Math.min(p.height, room);
      const top = flip ? a.top - height - 4 : a.bottom + 4;

      setPos({ top, left, maxHeight: room });
    }

    place();

    // The members list loads after the first paint, so the panel grows once
    // its options arrive — re-measure rather than leaving it placed for an
    // empty box, which is what pushed a tall list off the bottom of the screen.
    const observer = new ResizeObserver(place);
    if (panelRef.current) observer.observe(panelRef.current);

    // Follow the trigger while the page moves rather than drifting out of place.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef, align, width]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      data-cell-popover
      style={{
        width,
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        maxHeight: pos?.maxHeight,
        overflowY: "auto",
        // Hidden for the first frame, before placement is measured.
        visibility: pos ? "visible" : "hidden",
      }}
      className={cn(popoverClass, className)}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Shared open/close-on-outside-click behaviour for the three cell editors. */
function useCellPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      // The panel is portalled outside `ref`, so it needs its own check —
      // otherwise clicking any option would immediately close the popover.
      const inPanel = (target as Element | null)?.closest?.("[data-cell-popover]");
      if (!ref.current?.contains(target) && !inPanel) setOpen(false);
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
        <CellPopover anchorRef={ref} width={158}>
          <div role="menu">
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
        </CellPopover>
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
        <CellPopover anchorRef={ref} width={248}>
          <div role="menu">
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
        </CellPopover>
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
        <CellPopover
          anchorRef={ref}
          align={align}
          width={272}
          className="p-0 border-0 bg-transparent shadow-none"
        >
          <DatePicker
            value={dueDate ? new Date(dueDate) : new Date()}
            onChange={(date) => {
              onChange(date.toISOString());
              setOpen(false);
            }}
          />
        </CellPopover>
      ) : null}
    </div>
  );
}
