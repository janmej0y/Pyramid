"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Month grid used by the Dates row of the task details panel. Always renders
 * six weeks so the popover height doesn't jump between months, with leading and
 * trailing days dimmed.
 */
export function DatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange?: (date: Date) => void;
}) {
  const [cursor, setCursor] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const [selected, setSelected] = useState(value);

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  function shiftMonth(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  return (
    <div className="w-[248px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-menu)]">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <ChevronLeftIcon size={14} />
        </button>
        <span className="text-[12.5px] font-medium text-[var(--text)]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <ChevronRightIcon size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="flex h-7 items-center justify-center text-[11px] font-medium text-[var(--text-muted)]"
          >
            {day}
          </span>
        ))}

        {days.map((date) => {
          const outside = date.getMonth() !== cursor.getMonth();
          const active = isSameDay(date, selected);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => {
                setSelected(date);
                onChange?.(date);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center justify-self-center rounded-full text-[12px] transition-colors",
                active
                  ? "bg-[var(--btn-primary-bg)] font-medium text-[var(--btn-primary-fg)]"
                  : outside
                    ? "text-[var(--text-subtle)] hover:bg-[var(--hover)]"
                    : "text-[var(--text)] hover:bg-[var(--hover)]",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
