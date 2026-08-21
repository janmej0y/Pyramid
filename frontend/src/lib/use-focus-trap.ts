"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Confines Tab/Shift+Tab to `containerRef` while `active`.
 *
 * Without this a modal drawer is only visually modal: tabbing walks straight
 * out into the page behind it, where focus is invisible under the scrim.
 * Focus is moved to the first control on open and restored to whatever had it
 * when the trap releases.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first control, falling back to the container itself so focus
    // never remains outside the trap.
    const initial = container.querySelector<HTMLElement>(FOCUSABLE);
    if (initial) {
      initial.focus();
    } else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const node = containerRef.current;
      if (!node) return;

      // Re-queried per keypress: the drawer's contents can change while open.
      const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || !node.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last || !node.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // `container` is captured from this effect run rather than re-read on
      // cleanup: by then the ref may already point at a different node (or
      // null), and the check below would silently stop restoring focus.
      // Only restore if focus is still inside the trap — otherwise the user has
      // deliberately moved on and yanking focus back would be disorienting.
      if (previouslyFocused && container.contains(document.activeElement)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef]);
}
