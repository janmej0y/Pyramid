"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CheckIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Lets a parent (e.g. the toolbar's "Add" button) open this field. */
export type InlineAddHandle = { open: () => void };

/**
 * The "+ Add Task" affordance from the design. Clicking swaps the button for an
 * inline text field — the design shows no create modal, so creation happens in
 * place.
 *
 * Enter submits, Escape cancels, and blur on an empty field cancels. A submit
 * button appears as soon as there is text, so the action is discoverable rather
 * than relying on the reader knowing to press Enter.
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

  // Drives the submit affordance: hidden until there is real text, so an
  // empty row stays as quiet as the design's plain "+ Add Task".
  const hasText = value.trim().length > 0;

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

  function cancel() {
    setValue("");
    setEditing(false);
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
                cancel();
              }
            }}
            onBlur={(e) => {
              // Blur fires before the button's click, so a plain "cancel when
              // empty" check would unmount the submit button mid-click and
              // swallow it. Ignore blurs that move focus inside this row.
              if (e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                return;
              }
              if (!value.trim()) setEditing(false);
            }}
            placeholder={placeholder ?? label}
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none disabled:opacity-60"
          />

          {/* Only offered once there is something to submit. */}
          {hasText ? (
            <>
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                aria-label={`Cancel adding ${label.toLowerCase()}`}
                title="Cancel (Esc)"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-50"
              >
                <XIcon size={13} />
              </button>

              <button
                type="button"
                onClick={() => void commit()}
                disabled={pending}
                aria-label={label}
                title="Add (Enter)"
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-[var(--btn-primary-bg)] px-2 text-[11.5px] font-medium text-[var(--btn-primary-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <CheckIcon size={12} />
                {pending ? "Adding…" : "Add"}
              </button>
            </>
          ) : null}
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
