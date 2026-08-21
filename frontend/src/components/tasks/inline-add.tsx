"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Lets a parent (e.g. the toolbar's "Add" button) open this field. */
export type InlineAddHandle = { open: () => void };

/**
 * The "+ Add Task" affordance from the design. Clicking swaps the button for an
 * inline text field — the design shows no create modal, so creation happens in
 * place. Enter submits, Escape cancels, blur on an empty field cancels.
 */
export const InlineAdd = forwardRef<
  InlineAddHandle,
  {
    label: string;
    placeholder?: string;
    onSubmit: (title: string) => Promise<void> | void;
    className?: string;
  }
>(function InlineAdd({ label, placeholder, onSubmit, className }, ref) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Exposed so the toolbar can open this field directly, rather than
  // dispatching a synthetic click that other handlers would also see.
  useImperativeHandle(ref, () => ({
    open: () => {
      setEditing(true);
      rootRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
  }));

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

  return (
    <div ref={rootRef}>
      {editing ? (
        <div className={cn("flex items-center gap-1.5 px-4 py-1.5", className)}>
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
      ) : (
        <button
          type="button"
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
      )}
    </div>
  );
});
