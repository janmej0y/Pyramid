"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip } from "@/components/ui/chips";
import { DatePicker } from "@/components/tasks/date-picker";
import {
  CalendarIcon,
  CaretDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PriorityIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { activity, currentUser, detailTask } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { id: Priority; label: string; color: string }[] = [
  { id: "none", label: "No Priority", color: "var(--priority-none)" },
  { id: "urgent", label: "Urgent", color: "var(--priority-urgent)" },
  { id: "high", label: "High", color: "var(--priority-high)" },
  { id: "medium", label: "Medium", color: "var(--priority-medium)" },
  { id: "low", label: "Low", color: "var(--priority-low)" },
];

/** Left-hand label column of the details grid. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-[7px]">
      <span className="w-[62px] shrink-0 pt-[1px] text-[12px] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function TaskDetailsPanel() {
  const [priority, setPriority] = useState<Priority>(detailTask.priority);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2026, 0, 10));
  const [open, setOpen] = useState(true);

  const priorityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close whichever popover is open when clicking outside of it.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (priorityOpen && !priorityRef.current?.contains(target)) setPriorityOpen(false);
      if (dateOpen && !dateRef.current?.contains(target)) setDateOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [priorityOpen, dateOpen]);

  const activePriority = PRIORITY_OPTIONS.find((p) => p.id === priority) ?? PRIORITY_OPTIONS[2];

  return (
    <aside className="w-full shrink-0 lg:w-[236px]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex flex-1 items-center gap-1.5 text-[12.5px] font-medium text-[var(--text)]"
          >
            <CaretDownIcon
              size={12}
              className={cn("text-[var(--text-muted)] transition-transform", !open && "-rotate-90")}
            />
            Details
          </button>
          <button
            type="button"
            aria-label="Add detail"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <PlusIcon size={13} />
          </button>
          <button
            type="button"
            aria-label="Detail settings"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <SettingsIcon size={13} />
          </button>
        </div>

        {open ? (
          <div className="mt-1.5">
            <Row label="Status">
              <StatusChip status={detailTask.status} />
            </Row>

            <Row label="Priority">
              <div ref={priorityRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPriorityOpen((v) => !v)}
                  aria-expanded={priorityOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1.5 rounded text-[12px] font-medium transition-colors hover:opacity-80"
                  style={{ color: activePriority.color }}
                >
                  <PriorityIcon level={priority} size={13} />
                  {activePriority.label}
                  {priorityOpen ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
                </button>

                {priorityOpen ? (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-50 mt-1 w-[150px] animate-[menu-in_120ms_ease-out] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]"
                  >
                    <div className="px-2 py-1.5 text-[11px] font-medium text-[var(--text-subtle)]">
                      Priority
                    </div>
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={priority === option.id}
                        onClick={() => {
                          setPriority(option.id);
                          setPriorityOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--hover)]"
                        style={{ color: option.color }}
                      >
                        <PriorityIcon level={option.id} size={13} />
                        <span className="flex-1">{option.label}</span>
                        {priority === option.id ? (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m5 12.5 4.5 4.5L19 7" />
                          </svg>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </Row>

            <Row label="Members">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)] transition-colors hover:text-[var(--text-muted)]"
              >
                <UsersIcon size={13} />
                Add members
              </button>
            </Row>

            <Row label="Dates">
              <div ref={dateRef} className="relative">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDateOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-1.5 py-[3px] text-[11px] text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
                  >
                    <CalendarIcon size={11} className="text-[var(--text-muted)]" />
                    {new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(
                      startDate,
                    )}
                  </button>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[var(--text-subtle)]"
                    aria-hidden="true"
                  >
                    <path d="M4 12h16" />
                    <path d="m14 6 6 6-6 6" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setDateOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-1.5 py-[3px] text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)]"
                  >
                    <CalendarIcon size={11} />
                    End
                  </button>
                </div>

                {dateOpen ? (
                  <div className="absolute left-0 top-full z-50 mt-1.5 animate-[menu-in_120ms_ease-out]">
                    <DatePicker value={startDate} onChange={setStartDate} />
                  </div>
                ) : null}
              </div>
            </Row>

            <Row label="Labels">
              <span className="text-[12px] text-[var(--text-subtle)]">—</span>
            </Row>
            <Row label="Teams">
              <span className="text-[12px] text-[var(--text-subtle)]">—</span>
            </Row>
            <Row label="Reporter">
              <span className="text-[12px] text-[var(--text-subtle)]">—</span>
            </Row>
          </div>
        ) : null}
      </div>

      {/* Activity feed */}
      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text)]">
          <CaretDownIcon size={12} className="text-[var(--text-muted)]" />
          Updates
        </div>

        <ul className="mt-2 flex flex-col gap-2.5">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <span className="mt-[1px] shrink-0">
                {item.kind === "priority" ? (
                  <span className="text-[var(--priority-high)]">
                    <PriorityIcon level="high" size={14} />
                  </span>
                ) : (
                  <Avatar name={currentUser.name} src={currentUser.avatar} size="xs" />
                )}
              </span>
              <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-[var(--text-muted)]">
                <span className="font-medium text-[var(--text)]">{item.actor}</span>
                <br />
                {item.text}
                {item.meta ? ` · ${item.meta}` : null}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
