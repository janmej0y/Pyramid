"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";

type Align = "start" | "end";

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
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
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        rootRef.current?.querySelector<HTMLElement>("[data-menu-trigger]")?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const value = useMemo(() => ({ open, setOpen, menuId }), [open, setOpen, menuId]);

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
  const { open, setOpen, menuId } = useMenuContext("MenuTrigger");
  return (
    <button
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
  const { open, menuId } = useMenuContext("MenuContent");
  if (!open) return null;

  return (
    <div
      id={menuId}
      role="menu"
      style={{ marginTop: sideOffset, width }}
      className={cn(
        "absolute z-50 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-menu)]",
        "origin-top animate-[menu-in_120ms_ease-out]",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
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
