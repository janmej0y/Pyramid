"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { DueChip, LabelChip } from "@/components/ui/chips";
import { GripVerticalIcon, MoreHorizontalIcon, TrashIcon } from "@/components/ui/icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { InlineAdd, type InlineAddHandle } from "@/components/tasks/inline-add";
import { RowActions } from "@/components/tasks/row-actions";
import { useBoardDnd, type DragSource } from "@/lib/use-board-dnd";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/lib/types";

export type BoardColumn = { status: string; tasks: Task[] };

export type BoardHandlers = {
  onAdd?: (status: string, title: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onStatusChange?: (id: string, status: string) => Promise<void> | void;
  onPriorityChange?: (id: string, priority: Priority) => Promise<void> | void;
};

/** Column header menu: bulk actions over the whole column. */
function ColumnMenu({
  status,
  count,
  onClearColumn,
}: {
  status: string;
  count: number;
  onClearColumn: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Options for ${status}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        <MoreHorizontalIcon size={14} />
      </MenuTrigger>
      <MenuContent align="end" width={172}>
        <MenuItem
          onSelect={onClearColumn}
          disabled={count === 0}
          icon={<TrashIcon size={13} />}
          className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
        >
          Delete all ({count})
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function BoardCard({
  task,
  onDelete,
  onStatusChange,
  onPriorityChange,
  dnd,
}: { task: Task; dnd: ReturnType<typeof useBoardDnd> } & Omit<BoardHandlers, "onAdd">) {
  const source: DragSource = { id: task.id, status: task.status };
  const isActive = dnd.active?.id === task.id;
  const isHeld = dnd.isKeyboardDrag && isActive;

  return (
    <article
      data-board-card
      tabIndex={0}
      role="listitem"
      aria-roledescription="Draggable task"
      aria-grabbed={isActive || undefined}
      // Announces the held state and the current target column, so a screen
      // reader user knows where the card will land before committing.
      aria-label={
        isHeld
          ? `${task.title}, held. Target column ${dnd.overStatus ?? task.status}. Arrow keys to move, Space to drop, Escape to cancel.`
          : `${task.title}. Press Space to pick up.`
      }
      onKeyDown={(event) => dnd.handleCardKeyDown(event, source)}
      className={cn(
        "rounded-lg border bg-[var(--surface)] p-2.5 shadow-[var(--shadow-card)] transition-[border-color,opacity,transform]",
        isActive
          ? "border-[var(--accent)] opacity-60"
          : "border-[var(--border)] hover:border-[var(--border-strong)]",
        isHeld && "ring-2 ring-[var(--accent)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/*
          The grip is the drag handle. Keeping the drag off the whole card means
          the title stays a plain link and text stays selectable.
        */}
        <span
          onPointerDown={(event) => dnd.startPointerDrag(event, source, task.title)}
          aria-hidden="true"
          className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none text-[var(--text-subtle)] transition-colors hover:text-[var(--text-muted)] active:cursor-grabbing"
        >
          <GripVerticalIcon size={13} />
        </span>

        <Link
          href={`/tasks/${task.id}`}
          className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[var(--text)] hover:underline"
        >
          {task.title}
        </Link>

        <div className="-mr-1 shrink-0">
          <RowActions
            label={task.title}
            status={task.status}
            priority={task.priority}
            onStatusChange={
              onStatusChange ? (status) => void onStatusChange(task.id, status) : undefined
            }
            onPriorityChange={
              onPriorityChange
                ? (priority) => void onPriorityChange(task.id, priority)
                : undefined
            }
            onDelete={() => void onDelete?.(task.id)}
          />
        </div>
      </div>

      {/* Omitted entirely when a task has neither members nor a due date —
          an empty row of chips reads as a rendering fault. */}
      {task.members.length > 0 || task.dueDate ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {task.members.map((member) => (
              <Avatar key={member.id} name={member.name} src={member.avatar} size="xs" />
            ))}
            {task.members[0] ? (
              <span className="truncate text-[11.5px] text-[var(--text-muted)]">
                {task.members[0].name}
              </span>
            ) : null}
          </span>
          {task.dueDate ? <DueChip date={task.dueDate} /> : null}
        </div>
      ) : null}

      {task.labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.labels.map((label, index) => (
            <LabelChip key={`${label}-${index}`} label={label} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Horizontally scrolling kanban board. Columns keep a fixed width so cards stay
 * legible; the row scrolls rather than compressing them.
 *
 * Cards move between columns by pointer drag from the grip handle, or from the
 * keyboard — see `useBoardDnd` for the key bindings.
 */
export const TaskBoard = forwardRef<
  InlineAddHandle,
  { columns: BoardColumn[] } & BoardHandlers
>(function TaskBoard(
  { columns, onAdd, onDelete, onStatusChange, onPriorityChange },
  addRef,
) {
  const dnd = useBoardDnd({
    statuses: columns.map((column) => column.status),
    onMove: (id, status) => void onStatusChange?.(id, status),
  });

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-4 pb-6 sm:px-5">
        {columns.map((column, index) => {
          const isTarget = dnd.active !== null && dnd.overStatus === column.status;
          const isOrigin = dnd.active?.status === column.status;

          return (
            <section
              key={column.status}
              data-column-status={column.status}
              className={cn(
                "flex w-[248px] shrink-0 flex-col rounded-lg border transition-colors",
                isTarget && !isOrigin
                  ? "border-[var(--accent)] bg-[var(--drop-bg)]"
                  : "border-[var(--border)] bg-[var(--surface-muted)]",
              )}
            >
              <header className="flex items-center gap-1.5 px-2.5 py-2">
                <GripVerticalIcon size={13} className="shrink-0 text-[var(--text-subtle)]" />
                <h2 className="flex-1 truncate text-[12.5px] font-medium text-[var(--text)]">
                  {column.status}
                </h2>
                <span className="text-[11px] tabular-nums text-[var(--text-subtle)]">
                  {column.tasks.length}
                </span>
                <ColumnMenu
                  status={column.status}
                  count={column.tasks.length}
                  onClearColumn={() => {
                    for (const task of column.tasks) void onDelete?.(task.id);
                  }}
                />
              </header>

              <div role="list" className="flex flex-1 flex-col gap-2 px-2 pb-2">
                {column.tasks.map((task) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    dnd={dnd}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onPriorityChange={onPriorityChange}
                  />
                ))}

                {/* Drop hint keeps an empty target column from collapsing. */}
                {isTarget && !isOrigin ? (
                  <div className="rounded-lg border border-dashed border-[var(--accent)] px-2 py-3 text-center text-[11.5px] text-[var(--text-muted)]">
                    Move to {column.status}
                  </div>
                ) : null}

                {onAdd ? (
                  <InlineAdd
                    ref={index === 0 ? addRef : undefined}
                    label="Add Task"
                    onSubmit={(title) => onAdd(column.status, title)}
                    className="rounded-md px-1.5 py-1.5 text-[12px]"
                  />
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {/* Cursor-following ghost, pointer drags only. */}
      {dnd.ghost ? (
        <div
          aria-hidden="true"
          style={{ top: dnd.ghost.y + 12, left: dnd.ghost.x + 12 }}
          className="pointer-events-none fixed z-[150] max-w-[220px] truncate rounded-lg border border-[var(--accent)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text)] shadow-[var(--shadow-menu)]"
        >
          {dnd.ghost.label}
        </div>
      ) : null}

      {/* Live region: narrates pickup, target changes, and drop for AT users. */}
      <div role="status" aria-live="assertive" className="sr-only">
        {dnd.isKeyboardDrag && dnd.active
          ? `Holding task. Target column ${dnd.overStatus ?? dnd.active.status}.`
          : ""}
      </div>
    </>
  );
});
