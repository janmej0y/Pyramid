"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarIcon } from "@/components/ui/icons";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

/**
 * Two-pane application frame.
 *
 * Desktop: the sidebar is a static column that collapses via the topbar toggle.
 * Mobile:  the same toggle opens the sidebar as an overlay drawer, since a
 *          fixed column would leave no room for the content.
 */
export function AppShell({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Tab stays inside the drawer while it is open, and focus returns to the
  // trigger when it closes.
  useFocusTrap(drawerRef, mobileOpen);

  // Close the drawer on navigation so it never covers the destination page.
  // Adjusting during render (rather than in an effect) avoids a frame where the
  // new page is visible behind a still-open drawer.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // Lock body scroll behind the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--app-bg)]">
      {/* Desktop sidebar. Widens on larger viewports rather than staying fixed. */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 ease-out md:block",
          collapsed ? "w-0 overflow-hidden" : "w-[210px] lg:w-[228px] xl:w-[244px]",
        )}
      >
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-[min(84vw,278px)] animate-[drawer-in_180ms_ease-out] shadow-xl"
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[46px] shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] md:inline-flex"
          >
            <SidebarIcon size={16} />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={mobileOpen}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] md:hidden"
          >
            <SidebarIcon size={16} />
          </button>

          {breadcrumb ? (
            <>
              <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
              {breadcrumb}
            </>
          ) : null}
        </header>

        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
