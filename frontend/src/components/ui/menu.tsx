"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";

type Align = "start" | "end";

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
  /** The panel is portalled, so it positions itself against this element. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(component: string) {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error(`${component} must be used within <Menu>`);
  return ctx;
}

/**
 * Uncontrolled popover root. Closes on outside pointerdown and on Escape, and
 * restores focus to the trigger so keyboard users don't lose their place.
 */
export function Menu({
  children,
  open: controlledOpen,
  onOpenChange,
  className,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      // The panel is portalled outside rootRef, so it needs its own check —
      // otherwise clicking any menu item would immediately close the menu.
      const inPanel = (target as Element | null)?.closest?.("[data-menu-panel]");
      if (!rootRef.current?.contains(target) && !inPanel) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const value = useMemo(
    () => ({ open, setOpen, menuId, triggerRef }),
    [open, setOpen, menuId],
  );

  return (
    <MenuContext.Provider value={value}>
      <div ref={rootRef} className={cn("relative", className)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function MenuTrigger({
  children,
  className,
  asChildProps,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  asChildProps?: Record<string, unknown>;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">) {
  const { open, setOpen, menuId, triggerRef } = useMenuContext("MenuTrigger");
  return (
    <button
      ref={triggerRef}
      type="button"
      data-menu-trigger
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(!open)}
      className={cn("outline-none", className)}
      {...rest}
      {...asChildProps}
    >
      {children}
    </button>
  );
}

/**
 * Popover panel.
 *
 * Rendered through a portal into <body> with fixed positioning: table rows sit
 * inside an `overflow-hidden` card (needed for its rounded corners), which
 * would otherwise clip the menu — a long menu lost more than half its items.
 * Escaping to the body also means no ancestor's stacking context can bury it.
 */
export function MenuContent({
  children,
  align = "start",
  className,
  sideOffset = 6,
  width,
}: {
  children: React.ReactNode;
  align?: Align;
  className?: string;
  sideOffset?: number;
  width?: number | string;
}) {
  const { open, menuId, triggerRef } = useMenuContext("MenuContent");
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure after layout, when both trigger and panel have real dimensions.
  // No reset on close: the panel unmounts, so `pos` is re-measured on the next
  // open anyway — and clearing it here would be a setState inside an effect.
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const margin = 8;

      let left = align === "end" ? t.right - p.width : t.left;
      // Keep the panel inside the viewport horizontally.
      left = Math.min(
        Math.max(margin, left),
        window.innerWidth - p.width - margin,
      );

      // Flip above the trigger when there isn't room below.
      let top = t.bottom + sideOffset;
      if (top + p.height > window.innerHeight - margin) {
        const above = t.top - p.height - sideOffset;
        top = above >= margin ? above : Math.max(margin, window.innerHeight - p.height - margin);
      }

      setPos({ top, left });
    }

    place();

    // Reposition rather than drift out of place while the page moves.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, align, sideOffset, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      data-menu-panel
      style={{
        width,
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        // Hidden for the first frame, before placement is measured.
        visibility: pos ? "visible" : "hidden",
      }}
      className={cn(
        "fixed z-[100] max-h-[min(70vh,420px)] min-w-[180px] overflow-y-auto rounded-xl",
        "border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]",
        "origin-top animate-[menu-in_120ms_ease-out]",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1.5 text-[11px] font-medium text-[var(--text-subtle)]">{children}</div>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-[var(--border)]" />;
}

export function MenuItem({
  children,
  onSelect,
  icon,
  trailing,
  selected,
  hasSubmenu,
  disabled,
  className,
  closeOnSelect = true,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  hasSubmenu?: boolean;
  disabled?: boolean;
  className?: string;
  /** Set false for items that toggle state and should keep the menu open. */
  closeOnSelect?: boolean;
}) {
  const { setOpen } = useMenuContext("MenuItem");

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        // Submenu parents own their own open state; closing here would
        // dismiss the flyout the moment it is opened.
        if (closeOnSelect && !hasSubmenu) setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-[var(--text)]",
        "transition-colors hover:bg-[var(--hover)] focus-visible:bg-[var(--hover)] focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {icon ? <span className="flex w-4 shrink-0 justify-center text-[var(--text-muted)]">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {selected ? <CheckIcon size={14} className="text-[var(--text)]" /> : null}
      {hasSubmenu ? <ChevronRightIcon size={14} className="text-[var(--text-subtle)]" /> : null}
      {trailing}
    </button>
  );
}

/**
 * Checkbox row used by the Fields menu. The design shows a filled black box
 * when on and a light grey box when off.
 */
export function MenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
}: {
  children: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] text-[var(--text)] transition-colors hover:bg-[var(--hover)] focus-visible:bg-[var(--hover)] focus-visible:outline-none"
    >
      <span className="truncate">{children}</span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
          checked
            ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
            : "bg-[var(--hover)] border border-[var(--border-strong)]",
        )}
      >
        {checked ? <CheckIcon size={11} /> : null}
      </span>
    </button>
  );
}

/**
 * Nested flyout (Fields → Priority, Change Theme → Light/Dark). Opens on hover
 * and on click so it works for both pointer and touch input.
 */
export function MenuSub({
  label,
  icon,
  children,
  contentClassName,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => cancelClose(), []);

  return (
    <div className="relative" onMouseEnter={() => { cancelClose(); setOpen(true); }} onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-[var(--text)] transition-colors",
          open ? "bg-[var(--hover)]" : "hover:bg-[var(--hover)]",
        )}
      >
        {icon ? <span className="flex w-4 shrink-0 justify-center text-[var(--text-muted)]">{icon}</span> : null}
        <span className="flex-1 truncate">{label}</span>
        <ChevronRightIcon size={14} className="text-[var(--text-subtle)]" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute left-full top-0 z-50 ml-1 min-w-[170px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]",
            "animate-[menu-in_120ms_ease-out]",
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
