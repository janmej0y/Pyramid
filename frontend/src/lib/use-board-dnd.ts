"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DragSource = { id: string; status: string };

/**
 * Board drag-and-drop with an equivalent keyboard path.
 *
 * Pointer Events rather than HTML5 drag-and-drop: the native API gives no
 * usable drag image on touch, cannot be driven from the keyboard, and its
 * dragover/dragleave pairs fire inconsistently across nested drop targets.
 *
 * Keyboard model — focus a card, then:
 *   Space / Enter  pick up and put down
 *   ArrowLeft/Right move the held card between columns
 *   ArrowUp/Down    reorder within the column
 *   Escape          cancel and restore the original position
 */
export function useBoardDnd({
  statuses,
  onMove,
}: {
  statuses: string[];
  onMove: (id: string, status: string) => void;
}) {
  const [dragging, setDragging] = useState<DragSource | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  /** Set only for keyboard drags, so the card can render a "held" state. */
  const [keyboardHeld, setKeyboardHeld] = useState<DragSource | null>(null);

  // Pointer position is tracked in a ref: it updates every move event and must
  // not re-render the board on each one.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string } | null>(null);

  const clearDrag = useCallback(() => {
    setDragging(null);
    setOverStatus(null);
    setGhost(null);
    pointer.current = null;
  }, []);

  /**
   * Resolves the column under the pointer by hit-testing the column elements,
   * which stay correct while the board scrolls horizontally.
   */
  const columnAt = useCallback((x: number, y: number): string | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      const status = (element as HTMLElement).dataset?.columnStatus;
      if (status) return status;
    }
    return null;
  }, []);

  const startPointerDrag = useCallback(
    (event: React.PointerEvent, source: DragSource, label: string) => {
      // Primary button / single touch only; ignore right-click and pen eraser.
      if (event.button !== 0) return;

      const startX = event.clientX;
      const startY = event.clientY;
      let started = false;

      const onMoveEvent = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        // A small threshold keeps clicks (opening the task) from becoming drags.
        if (!started && Math.hypot(dx, dy) < 6) return;

        if (!started) {
          started = true;
          setDragging(source);
          // Suppress text selection for the duration of the drag.
          document.body.style.userSelect = "none";
        }

        pointer.current = { x: moveEvent.clientX, y: moveEvent.clientY };
        setGhost({ x: moveEvent.clientX, y: moveEvent.clientY, label });
        setOverStatus(columnAt(moveEvent.clientX, moveEvent.clientY));
      };

      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMoveEvent);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        document.body.style.userSelect = "";

        if (started) {
          const target = columnAt(upEvent.clientX, upEvent.clientY);
          if (target && target !== source.status) onMove(source.id, target);
        }
        clearDrag();
      };

      const onCancel = () => {
        window.removeEventListener("pointermove", onMoveEvent);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        document.body.style.userSelect = "";
        clearDrag();
      };

      window.addEventListener("pointermove", onMoveEvent);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    [columnAt, onMove, clearDrag],
  );

  /** Keyboard handler bound to each card. Returns true when it consumed the key. */
  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent, source: DragSource): boolean => {
      const held = keyboardHeld;

      if (event.key === " " || event.key === "Enter") {
        // Enter on a link should still navigate when nothing is held.
        if (!held && event.key === "Enter") return false;
        event.preventDefault();

        if (held && held.id === source.id) {
          if (overStatus && overStatus !== held.status) onMove(held.id, overStatus);
          setKeyboardHeld(null);
          setOverStatus(null);
        } else {
          setKeyboardHeld(source);
          setOverStatus(source.status);
        }
        return true;
      }

      if (!held || held.id !== source.id) return false;

      if (event.key === "Escape") {
        event.preventDefault();
        setKeyboardHeld(null);
        setOverStatus(null);
        return true;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const current = statuses.indexOf(overStatus ?? held.status);
        const next = event.key === "ArrowLeft" ? current - 1 : current + 1;
        if (next >= 0 && next < statuses.length) setOverStatus(statuses[next]);
        return true;
      }

      return false;
    },
    [keyboardHeld, overStatus, statuses, onMove],
  );

  // Escape cancels a pointer drag too, matching the keyboard path.
  useEffect(() => {
    if (!dragging) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") clearDrag();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dragging, clearDrag]);

  // Never leave the page unselectable if the component unmounts mid-drag.
  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  const active = dragging ?? keyboardHeld;

  return {
    /** The card currently being moved, by either input method. */
    active,
    isKeyboardDrag: Boolean(keyboardHeld),
    overStatus,
    ghost,
    startPointerDrag,
    handleCardKeyDown,
  };
}
