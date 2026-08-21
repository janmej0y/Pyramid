"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { UndoIcon } from "@/components/ui/icons";

export type Toast = {
  id: number;
  message: string;
  /** Present for undoable actions; the label sits on the action button. */
  actionLabel?: string;
  onAction?: () => void;
  /** Milliseconds before auto-dismiss. */
  duration: number;
  tone: "default" | "danger";
};

type ShowToastInput = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  tone?: Toast["tone"];
};

type ToastContextValue = {
  showToast: (input: ShowToastInput) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Returns the toast API, or a no-op when rendered outside the provider so a
 * component can be unit-rendered in isolation without crashing.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return (
    ctx ?? {
      showToast: () => -1,
      dismissToast: () => {},
    }
  );
}

let nextId = 1;

/** The mounted flag never changes after hydration, so there is nothing to subscribe to. */
function subscribeToNothing() {
  return () => {};
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Timers are keyed by toast id so dismissing early cancels the pending timer.
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, actionLabel, onAction, duration = 6000, tone = "default" }: ShowToastInput) => {
      const id = nextId++;
      setToasts((prev) => [
        // Cap the stack; the oldest drops out rather than filling the screen.
        ...prev.slice(-2),
        { id, message, actionLabel, onAction, duration, tone },
      ]);

      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration),
      );

      return id;
    },
    [],
  );

  // Clear every outstanding timer if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  // Portals target document.body, which does not exist during SSR. This
  // returns false on the server and during the hydration pass, then true once
  // mounted — so server and first client render agree. Branching on
  // `typeof document` instead diverges between the two passes and makes React
  // discard the whole tree as a hydration mismatch.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      // `polite` so an undo offer is announced without interrupting, and the
      // region stays mounted so screen readers pick up later insertions.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-start sm:p-5"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-[380px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 shadow-[var(--shadow-menu)] animate-[toast-in_160ms_ease-out]"
        >
          <span
            className={
              toast.tone === "danger"
                ? "min-w-0 flex-1 text-[13px] text-[var(--danger-fg)]"
                : "min-w-0 flex-1 text-[13px] text-[var(--text)]"
            }
          >
            {toast.message}
          </span>

          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <UndoIcon size={13} />
              {toast.actionLabel}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded p-1 text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
