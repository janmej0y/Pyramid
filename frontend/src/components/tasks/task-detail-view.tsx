"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { LabelChip } from "@/components/ui/chips";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskDetailsPanel } from "@/components/tasks/task-details-panel";
import {
  AtSignIcon,
  CalendarIcon,
  EyeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  PaperclipIcon,
  SendIcon,
  ShareIcon,
  SmileIcon,
} from "@/components/ui/icons";
import { comments, currentUser, detailTask, subtasks } from "@/lib/data";
import { formatDateShort } from "@/lib/utils";
import type { FieldKey } from "@/lib/types";

const SUBTASK_FIELDS: Record<FieldKey, boolean> = {
  priority: true,
  members: true,
  dueDate: true,
  assignees: true,
  labels: false,
  status: false,
  reporter: false,
};

export function TaskDetailView({ title }: { title: string }) {
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState("");

  return (
    <div className="px-4 pb-10 pt-4 sm:px-6">
      {/* Title row with the header action cluster */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-[560px] text-[12.5px] leading-relaxed text-[var(--text-muted)]">
            {detailTask.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Lock task"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <LockIcon size={13} />
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--border)] px-2 text-[11.5px] text-[var(--accent)] transition-colors hover:bg-[var(--hover)]"
          >
            <EyeIcon size={13} />1
          </button>
          <button
            type="button"
            aria-label="Share task"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <ShareIcon size={13} />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <MoreHorizontalIcon size={14} />
          </button>
          <button
            type="button"
            aria-label="Toggle details panel"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <PanelRightIcon size={13} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Properties */}
          <dl className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <dt className="w-[70px] shrink-0 text-[12px] text-[var(--text-muted)]">Properties</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text)]">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--hover)] text-[9px] font-medium text-[var(--text-muted)]">
                    A
                  </span>
                  {detailTask.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--due-bg)] px-1.5 py-[3px] text-[11px] font-medium text-[var(--due-fg)]">
                  <CalendarIcon size={11} />
                  {formatDateShort(detailTask.dueDate)}
                </span>
              </dd>
            </div>

            <div className="flex items-center gap-3">
              <dt className="w-[70px] shrink-0 text-[12px] text-[var(--text-muted)]">Labels</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                {detailTask.labels.map((label) => (
                  <LabelChip key={label} label={label} />
                ))}
              </dd>
            </div>

            <div className="flex items-center gap-3">
              <dt className="w-[70px] shrink-0 text-[12px] text-[var(--text-muted)]">Resources</dt>
              <dd className="min-w-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-subtle)] transition-colors hover:text-[var(--text)]"
                >
                  <AtSignIcon size={12} />
                  Add document or link...
                </button>
              </dd>
            </div>
          </dl>

          {/* Subtasks table */}
          <div className="mt-5">
            <TaskTable
              group="Subtasks"
              tasks={subtasks}
              fields={SUBTASK_FIELDS}
              addLabel="Add Subtasks"
            />
          </div>

          {/* Comment thread */}
          <h2 className="mb-2 text-[13px] font-medium text-[var(--text)]">Subtasks</h2>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {comments.map((entry) => (
              <div key={entry.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={entry.author.name} src={entry.author.avatar} size="sm" />
                  <span className="text-[12.5px] font-medium text-[var(--text)]">
                    {entry.author.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-subtle)]">{entry.createdAt}</span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    aria-label="React"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
                  >
                    <SmileIcon size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Comment options"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
                  >
                    <MoreHorizontalIcon size={14} />
                  </button>
                </div>
                <p className="mt-1.5 pl-8 text-[12.5px] text-[var(--text)]">{entry.body}</p>
              </div>
            ))}

            {/* Reply composer */}
            <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2">
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Leave a reply..."
                aria-label="Leave a reply"
                className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Attach file"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <PaperclipIcon size={14} />
              </button>
              <button
                type="button"
                aria-label="Send reply"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <SendIcon size={14} />
              </button>
            </div>
          </div>

          {/* New comment composer */}
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                aria-label="Add a comment"
                className="min-w-0 flex-1 bg-transparent py-2 text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Attach file"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <PaperclipIcon size={14} />
              </button>
              <button
                type="button"
                aria-label="Send comment"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <SendIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        <TaskDetailsPanel />
      </div>
    </div>
  );
}
