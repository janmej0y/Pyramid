"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Click-to-edit text. Renders as plain text until clicked, then becomes an
 * input/textarea. Saves on blur or Enter, reverts on Escape.
 *
 * The design shows no edit affordance on the task title or description, so
 * editing is inline rather than behind a button or modal.
 */
export function EditableText({
  value,
  onSave,
  as = "input",
  placeholder,
  className,
  inputClassName,
  ariaLabel,
}: {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  as?: "input" | "textarea";
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Re-sync when the upstream value changes (e.g. after a refetch). Adjusting
  // during render rather than in an effect avoids a cascading second render.
  if (value !== lastValue) {
    setLastValue(value);
    if (!editing) setDraft(value);
  }

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  async function commit() {
    const next = draft.trim();
    setEditing(false);

    if (next === value.trim()) return;
    if (!next && as === "input") {
      // An empty title is not valid; restore the previous value.
      setDraft(value);
      return;
    }

    setSaving(true);
    try {
      await onSave(next);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${ariaLabel}`}
        className={cn(
          "block w-full cursor-text rounded text-left transition-colors hover:bg-[var(--hover)]",
          saving && "opacity-60",
          className,
        )}
      >
        {value || (
          <span className="text-[var(--text-subtle)]">{placeholder ?? `Add ${ariaLabel}`}</span>
        )}
      </button>
    );
  }

  const Tag = as;

  return (
    <Tag
      ref={ref}
      value={draft}
      aria-label={ariaLabel}
      rows={as === "textarea" ? 3 : undefined}
      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value)
      }
      onBlur={() => void commit()}
      onKeyDown={(e: React.KeyboardEvent) => {
        // Enter saves a single-line field; textareas keep Enter for newlines
        // and save with Cmd/Ctrl+Enter.
        if (e.key === "Enter" && (as === "input" || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn(
        "block w-full resize-none rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5",
        "text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
        inputClassName ?? className,
      )}
    />
  );
}
