"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { DueChip, LabelChip } from "@/components/ui/chips";
import { GripVerticalIcon, MoreHorizontalIcon, TrashIcon } from "@/components/ui/icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { InlineAdd } from "@/components/tasks/inline-add";
import { RowActions } from "@/components/tasks/row-actions";
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
}: { task: Task } & Omit<BoardHandlers, "onAdd">) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-[13px] font-medium leading-snug text-[var(--text)] hover:underline"
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
 */
export function TaskBoard({
  columns,
  onAdd,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: { columns: BoardColumn[] } & BoardHandlers) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-6 sm:px-5">
      {columns.map((column, index) => (
        <section
          key={column.status}
          className="flex w-[248px] shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
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

          <div className="flex flex-col gap-2 px-2 pb-2">
            {column.tasks.map((task) => (
              <BoardCard
                key={task.id}
                task={task}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
              />
            ))}

            {onAdd ? (
              <InlineAdd
                label="Add Task"
                onSubmit={(title) => onAdd(column.status, title)}
                addTarget={index === 0}
                className="rounded-md px-1.5 py-1.5 text-[12px]"
              />
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
