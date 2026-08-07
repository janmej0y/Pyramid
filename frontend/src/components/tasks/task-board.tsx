"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { DueChip, LabelChip } from "@/components/ui/chips";
import { GripVerticalIcon, MoreHorizontalIcon, PlusIcon } from "@/components/ui/icons";
import type { Task } from "@/lib/types";

export type BoardColumn = { status: string; tasks: Task[] };

function BoardCard({ task }: { task: Task }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-[13px] font-medium leading-snug text-[var(--text)] hover:underline"
        >
          {task.title}
        </Link>
        <button
          type="button"
          aria-label={`Actions for ${task.title}`}
          className="-mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          <MoreHorizontalIcon size={14} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {task.members.map((member) => (
            <Avatar key={member.id} name={member.name} src={member.avatar} size="xs" />
          ))}
          <span className="truncate text-[11.5px] text-[var(--text-muted)]">
            {task.members[0]?.name}
          </span>
        </span>
        <DueChip date={task.dueDate} />
      </div>

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
export function TaskBoard({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-6 sm:px-5">
      {columns.map((column) => (
        <section
          key={column.status}
          className="flex w-[248px] shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
        >
          <header className="flex items-center gap-1.5 px-2.5 py-2">
            <GripVerticalIcon size={13} className="shrink-0 text-[var(--text-subtle)]" />
            <h2 className="flex-1 truncate text-[12.5px] font-medium text-[var(--text)]">
              {column.status}
            </h2>
            <button
              type="button"
              aria-label={`Add task to ${column.status}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              <PlusIcon size={13} />
            </button>
            <button
              type="button"
              aria-label={`Options for ${column.status}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              <MoreHorizontalIcon size={14} />
            </button>
          </header>

          <div className="flex flex-col gap-2 px-2 pb-2">
            {column.tasks.map((task) => (
              <BoardCard key={task.id} task={task} />
            ))}

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              <PlusIcon size={13} />
              Add Task
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
