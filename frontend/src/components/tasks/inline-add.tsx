"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * The "+ Add Task" affordance from the design. Clicking swaps the button for an
 * inline text field — the design shows no create modal, so creation happens in
 * place. Enter submits, Escape cancels, blur on an empty field cancels.
 */
export function InlineAdd({
  label,
  placeholder,
  onSubmit,
  className,
  /** Marks the field the toolbar's "Add" button targets. */
  addTarget,
}: {
  label: string;
  placeholder?: string;
  onSubmit: (title: string) => Promise<void> | void;
  className?: string;
  addTarget?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const title = value.trim();
    if (!title) {
      setEditing(false);
      return;
    }
    setPending(true);
    try {
      await onSubmit(title);
      setValue("");
      // Stay open so several rows can be added in a row, as in the design.
      inputRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        data-add-target={addTarget ? "" : undefined}
        onClick={() => setEditing(true)}
        className={cn(
          "flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-[12.5px] text-[var(--text-muted)]",
          "transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]",
          className,
        )}
      >
        <PlusIcon size={13} />
        {label}
      </button>
    );
  }

  return (
    <div
      data-add-target={addTarget ? "" : undefined}
      className={cn("flex items-center gap-1.5 px-4 py-1.5", className)}
    >
      <PlusIcon size={13} className="shrink-0 text-[var(--text-subtle)]" />
      <input
        ref={inputRef}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") {
            setValue("");
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (!value.trim()) setEditing(false);
        }}
        placeholder={placeholder ?? label}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}
