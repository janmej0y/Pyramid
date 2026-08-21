"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarAdd } from "@/components/ui/avatar";
import { PriorityChip } from "@/components/ui/chips";
import { CaretDownIcon, CaretRightIcon } from "@/components/ui/icons";
import { InlineAdd, type InlineAddHandle } from "@/components/tasks/inline-add";
import { RowActions } from "@/components/tasks/row-actions";
import {
  DueDateCell,
  MembersCell,
  PriorityCell,
} from "@/components/tasks/cell-editors";
import { cn, formatDateLong } from "@/lib/utils";
import type { FieldKey, Priority, Task } from "@/lib/types";

export type TaskTableProps = {
  group: string;
  tasks: Task[];
  fields: Record<FieldKey, boolean>;
  /** Column header for the first column ("Task", "Projects", ...). */
  itemLabel?: string;
  addLabel?: string;
  /** Row links are omitted for subtask tables, which aren't navigable. */
  linkPrefix?: string;
  onAdd?: (title: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onStatusChange?: (id: string, status: string) => Promise<void> | void;
  onPriorityChange?: (id: string, priority: Priority) => Promise<void> | void;
  onMembersChange?: (id: string, memberIds: string[]) => Promise<void> | void;
  onDueDateChange?: (id: string, dueDate: string) => Promise<void> | void;
  /** Subtask tables have no status column to move between. */
  showStatusActions?: boolean;
};

/**
 * One collapsible status section rendered as a card-wrapped table.
 *
 * Below `md` the table switches to a stacked card layout — a 5-column grid at
 * 375px would either overflow or crush the task title to a few characters.
 */
export const TaskTable = forwardRef<InlineAddHandle, TaskTableProps>(
  function TaskTable(
    {
      group,
      tasks,
      fields,
      itemLabel = "Task",
      addLabel = "Add Task",
      linkPrefix,
      onAdd,
      onDelete,
      onStatusChange,
      onPriorityChange,
      onMembersChange,
      onDueDateChange,
      showStatusActions = true,
    },
    addRef,
  ) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-1.5 flex items-center gap-1.5 rounded px-0.5 py-0.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:text-[var(--text-muted)]"
      >
        {open ? (
          <CaretDownIcon size={13} className="text-[var(--text-muted)]" />
        ) : (
          <CaretRightIcon size={13} className="text-[var(--text-muted)]" />
        )}
        {group}
      </button>

      {open ? (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          {/* Header row — desktop only */}
          <div
            className="hidden items-center gap-3 border-b border-[var(--border)] bg-[var(--table-head-bg)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-muted)] md:flex"
            role="row"
          >
            <span className="min-w-0 flex-1">{itemLabel}</span>
            {fields.priority ? <span className="w-[88px] shrink-0">Priority</span> : null}
            {fields.members ? <span className="w-[76px] shrink-0">Members</span> : null}
            {fields.dueDate ? <span className="w-[104px] shrink-0">Due Date</span> : null}
            <span className="w-[52px] shrink-0 text-right">Actions</span>
          </div>

          <ul>
            {tasks.map((task) => {
              const title = linkPrefix ? (
                <Link
                  href={`${linkPrefix}/${task.id}`}
                  className="truncate text-[13px] text-[var(--text)] hover:underline"
                >
                  {task.title}
                </Link>
              ) : (
                <span className="truncate text-[13px] text-[var(--text)]">{task.title}</span>
              );

              return (
                <li
                  key={task.id}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--hover)]"
                >
                  {/* Desktop row */}
                  <div className="hidden items-center gap-3 px-4 py-2.5 md:flex">
                    <div className="min-w-0 flex-1">{title}</div>

                    {/* Each cell is directly editable — the ··· menu alone
                        left no way to set members or a due date. */}
                    {fields.priority ? (
                      <div className="w-[88px] shrink-0">
                        {onPriorityChange ? (
                          <PriorityCell
                            priority={task.priority}
                            onChange={(next) => void onPriorityChange(task.id, next)}
                          />
                        ) : (
                          <PriorityChip priority={task.priority} />
                        )}
                      </div>
                    ) : null}

                    {fields.members ? (
                      <div className="flex w-[76px] shrink-0 items-center">
                        {onMembersChange ? (
                          <MembersCell
                            members={task.members}
                            onChange={(ids) => void onMembersChange(task.id, ids)}
                          />
                        ) : task.members.length > 0 ? (
                          task.members.map((member) => (
                            <Avatar
                              key={member.id}
                              name={member.name}
                              src={member.avatar}
                              size="sm"
                            />
                          ))
                        ) : (
                          <AvatarAdd size="sm" />
                        )}
                      </div>
                    ) : null}

                    {fields.dueDate ? (
                      <div className="w-[104px] shrink-0 text-[12.5px] text-[var(--text)]">
                        {onDueDateChange ? (
                          <DueDateCell
                            dueDate={task.dueDate}
                            onChange={(iso) => void onDueDateChange(task.id, iso)}
                          />
                        ) : task.dueDate ? (
                          formatDateLong(task.dueDate)
                        ) : (
                          <span className="text-[var(--text-subtle)]">—</span>
                        )}
                      </div>
                    ) : null}

                    <div className="flex w-[52px] shrink-0 justify-end">
                      <RowActions
                        label={task.title}
                        status={task.status}
                        priority={task.priority}
                        showStatus={showStatusActions}
                        onStatusChange={
                          onStatusChange
                            ? (status) => void onStatusChange(task.id, status)
                            : undefined
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

                  {/* Mobile stacked card */}
                  <div className="flex items-start gap-3 px-3 py-3 md:hidden">
                    <div className="min-w-0 flex-1">
                      {title}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {fields.priority ? (
                          onPriorityChange ? (
                            <PriorityCell
                              priority={task.priority}
                              onChange={(next) => void onPriorityChange(task.id, next)}
                            />
                          ) : (
                            <PriorityChip priority={task.priority} />
                          )
                        ) : null}

                        {fields.dueDate ? (
                          onDueDateChange ? (
                            <DueDateCell
                              dueDate={task.dueDate}
                              onChange={(iso) => void onDueDateChange(task.id, iso)}
                            />
                          ) : task.dueDate ? (
                            <span className="text-[11.5px] text-[var(--text-muted)]">
                              {formatDateLong(task.dueDate)}
                            </span>
                          ) : null
                        ) : null}

                        {fields.members ? (
                          onMembersChange ? (
                            <MembersCell
                              members={task.members}
                              size="xs"
                              onChange={(ids) => void onMembersChange(task.id, ids)}
                            />
                          ) : (
                            <span className="flex items-center">
                              {task.members.length > 0 ? (
                                task.members.map((member) => (
                                  <Avatar
                                    key={member.id}
                                    name={member.name}
                                    src={member.avatar}
                                    size="xs"
                                  />
                                ))
                              ) : (
                                <AvatarAdd size="xs" />
                              )}
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                    <RowActions
                      label={task.title}
                      status={task.status}
                      priority={task.priority}
                      showStatus={showStatusActions}
                      onStatusChange={
                        onStatusChange
                          ? (status) => void onStatusChange(task.id, status)
                          : undefined
                      }
                      onPriorityChange={
                        onPriorityChange
                          ? (priority) => void onPriorityChange(task.id, priority)
                          : undefined
                      }
                      onDelete={() => void onDelete?.(task.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {onAdd ? (
            <InlineAdd
              ref={addRef}
              label={addLabel}
              onSubmit={onAdd}
              className={cn(tasks.length > 0 && "border-t border-[var(--border)]")}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
  },
);
