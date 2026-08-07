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
import { api, type ApiTask } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDateShort } from "@/lib/utils";
import type { FieldKey, Task } from "@/lib/types";

const SUBTASK_FIELDS: Record<FieldKey, boolean> = {
  priority: true,
  members: true,
  dueDate: true,
  assignees: true,
  labels: false,
  status: false,
  reporter: false,
};

function toTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    members: task.members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar })),
    dueDate: task.dueDate ?? "",
    labels: task.labels,
  };
}

export function TaskDetailView({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const { data: task, loading, error } = useAsync(() => api.getTask(taskId), [taskId]);
  const {
    data: comments,
    loading: commentsLoading,
    reload: reloadComments,
  } = useAsync(() => api.listComments(taskId), [taskId]);

  // Fetched as flat rows so the subtask table gets the same shape as the list.
  const { data: subtaskData } = useAsync(
    () => api.listTasks({ parentId: taskId }).then((r) => r.items),
    [taskId],
  );

  async function postComment() {
    const body = comment.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      await api.createComment(taskId, body);
      setComment("");
      reloadComments();
    } catch {
      // Surfaced by the reload; the composer keeps the text so it isn't lost.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="px-6 py-10 text-[13px] text-[var(--text-muted)]">Loading task…</p>
    );
  }

  if (error || !task) {
    return (
      <p role="alert" className="px-6 py-10 text-[13px] text-[var(--danger-fg)]">
        {error ?? "Task not found."}
      </p>
    );
  }

  const subtasks = (subtaskData ?? []).map(toTask);

  return (
    <div className="px-4 pb-10 pt-4 sm:px-6">
      {/* Title row with the header action cluster */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
            {task.title}
          </h1>
          {task.description ? (
            <p className="mt-1.5 max-w-[560px] text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              {task.description}
            </p>
          ) : null}
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
                  {task.reporter?.name ?? "Unassigned"}
                </span>
                {task.dueDate ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--due-bg)] px-1.5 py-[3px] text-[11px] font-medium text-[var(--due-fg)]">
                    <CalendarIcon size={11} />
                    {formatDateShort(task.dueDate)}
                  </span>
                ) : null}
              </dd>
            </div>

            <div className="flex items-center gap-3">
              <dt className="w-[70px] shrink-0 text-[12px] text-[var(--text-muted)]">Labels</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                {task.labels.length > 0 ? (
                  task.labels.map((label, index) => (
                    <LabelChip key={`${label}-${index}`} label={label} />
                  ))
                ) : (
                  <span className="text-[12px] text-[var(--text-subtle)]">No labels</span>
                )}
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
            {commentsLoading ? (
              <p className="px-3 py-3 text-[12px] text-[var(--text-muted)]">Loading comments…</p>
            ) : null}

            {(comments ?? []).map((entry) => (
              <div key={entry.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={entry.author.name} src={entry.author.avatar} size="sm" />
                  <span className="text-[12.5px] font-medium text-[var(--text)]">
                    {entry.author.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-subtle)]">
                    {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
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
              <Avatar name={user?.name ?? "Guest"} src={user?.avatar} size="sm" />
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void postComment();
                  }
                }}
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
                onClick={() => void postComment()}
                disabled={!comment.trim() || submitting}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40"
              >
                <SendIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        <TaskDetailsPanel
          taskId={task.id}
          priority={task.priority}
          status={task.status}
        />
      </div>
    </div>
  );
}
