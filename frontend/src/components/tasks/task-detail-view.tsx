"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { LabelChip } from "@/components/ui/chips";
import { EditableText } from "@/components/ui/editable-text";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskDetailsPanel } from "@/components/tasks/task-details-panel";
import {
  AtSignIcon,
  CalendarIcon,
  EyeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  SendIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { STATUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api, type ApiTask } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDateShort } from "@/lib/utils";
import type { FieldKey, Priority, Task } from "@/lib/types";

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
  const [locked, setLocked] = useState(false);
  const [watching, setWatching] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: task,
    loading,
    error,
    reload: reloadTask,
  } = useAsync(() => api.getTask(taskId), [taskId]);

  const {
    data: comments,
    loading: commentsLoading,
    reload: reloadComments,
  } = useAsync(() => api.listComments(taskId), [taskId]);

  // Fetched as flat rows so the subtask table gets the same shape as the list.
  const { data: subtaskData, reload: reloadSubtasks } = useAsync(
    () => api.listTasks({ parentId: taskId }).then((r) => r.items),
    [taskId],
  );

  async function postComment(body: string, parentId?: string) {
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await api.createComment(taskId, text, parentId);
      if (parentId) setReply("");
      else setComment("");
      reloadComments();
    } catch {
      // The composer keeps its text so nothing is lost on failure.
    } finally {
      setSubmitting(false);
    }
  }

  async function removeComment(id: string) {
    await api.deleteComment(id);
    reloadComments();
  }

  async function saveField(patch: Record<string, unknown>) {
    await api.updateTask(taskId, patch);
    reloadTask();
  }

  async function addSubtask(title: string) {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    await api.createTask({ title, parentId: taskId, dueDate: due.toISOString() });
    reloadSubtasks();
  }

  async function deleteSubtask(id: string) {
    await api.deleteTask(id);
    reloadSubtasks();
  }

  async function changeSubtaskPriority(id: string, priority: Priority) {
    await api.updateTask(id, { priority });
    reloadSubtasks();
  }

  async function changeSubtaskMembers(id: string, memberIds: string[]) {
    await api.updateTask(id, { assigneeIds: memberIds });
    reloadSubtasks();
  }

  async function changeSubtaskDueDate(id: string, dueDate: string) {
    await api.updateTask(id, { dueDate });
    reloadSubtasks();
  }

  async function deleteTask() {
    await api.deleteTask(taskId);
    router.push("/tasks");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied; nothing else to fall back to here.
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
  // The design shows a single reply box under the thread, so replies attach to
  // the most recent top-level comment.
  const threadParentId = comments?.at(-1)?.id;

  return (
    <div className="relative px-4 pb-10 pt-4 sm:px-6">
      {copied ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[var(--btn-primary-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--btn-primary-fg)] shadow-lg"
        >
          Link copied
        </div>
      ) : null}

      {/* Title row with the header action cluster */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <EditableText
            value={task.title}
            ariaLabel="task title"
            onSave={(title) => saveField({ title })}
            className="-mx-1 px-1 text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]"
            inputClassName="text-[19px] font-semibold tracking-[-0.015em]"
          />
          <EditableText
            value={task.description ?? ""}
            ariaLabel="description"
            as="textarea"
            placeholder="Add a description…"
            onSave={(description) => saveField({ description })}
            className="mt-1.5 -mx-1 max-w-[560px] px-1 text-[12.5px] leading-relaxed text-[var(--text-muted)]"
            inputClassName="mt-1.5 max-w-[560px] text-[12.5px] leading-relaxed"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={locked ? "Unlock task" : "Lock task"}
            aria-pressed={locked}
            onClick={() => setLocked((v) => !v)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] transition-colors hover:bg-[var(--hover)]",
              locked
                ? "bg-[var(--hover)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            <LockIcon size={13} />
          </button>

          <button
            type="button"
            aria-label={watching ? "Stop watching" : "Watch task"}
            aria-pressed={watching}
            onClick={() => setWatching((v) => !v)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border border-[var(--border)] px-2 text-[11.5px] transition-colors hover:bg-[var(--hover)]",
              watching ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
            )}
          >
            <EyeIcon size={13} />
            {watching ? 1 : 0}
          </button>

          <button
            type="button"
            aria-label="Copy link to task"
            onClick={copyLink}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <ShareIcon size={13} />
          </button>

          <Menu>
            <MenuTrigger
              aria-label="More options"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              <MoreHorizontalIcon size={14} />
            </MenuTrigger>
            <MenuContent align="end" width={176}>
              <MenuLabel>Move to</MenuLabel>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option}
                  selected={task.status === option}
                  onSelect={() => void saveField({ status: option })}
                >
                  {option}
                </MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem icon={<ShareIcon size={13} />} onSelect={copyLink}>
                Copy link
              </MenuItem>
              <MenuItem
                icon={<TrashIcon size={13} />}
                onSelect={() => void deleteTask()}
                className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
              >
                Delete task
              </MenuItem>
            </MenuContent>
          </Menu>

          <button
            type="button"
            aria-label={panelOpen ? "Hide details panel" : "Show details panel"}
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen((v) => !v)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] transition-colors hover:bg-[var(--hover)]",
              panelOpen
                ? "bg-[var(--hover)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
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
                {/*
                  Resources are not part of the API schema, so this row stays
                  presentational rather than pretending to persist. Documented
                  in the README.
                */}
                <span
                  className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-subtle)]"
                  title="Attachments are outside this assessment's scope"
                >
                  <AtSignIcon size={12} />
                  Add document or link...
                </span>
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
              showStatusActions={false}
              onAdd={addSubtask}
              onDelete={deleteSubtask}
              onPriorityChange={changeSubtaskPriority}
              onMembersChange={changeSubtaskMembers}
              onDueDateChange={changeSubtaskDueDate}
            />
          </div>

          {/* Comment thread */}
          <h2 className="mb-2 text-[13px] font-medium text-[var(--text)]">Comments</h2>

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
                  <Menu>
                    <MenuTrigger
                      aria-label={`Options for comment by ${entry.author.name}`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    >
                      <MoreHorizontalIcon size={14} />
                    </MenuTrigger>
                    <MenuContent align="end" width={150}>
                      <MenuItem
                        icon={<TrashIcon size={13} />}
                        // The API rejects deleting someone else's comment;
                        // disabling here avoids an inevitable 403.
                        disabled={entry.author.id !== user?.id}
                        onSelect={() => void removeComment(entry.id)}
                        className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
                      >
                        Delete
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </div>
                <p className="mt-1.5 pl-8 text-[12.5px] text-[var(--text)]">{entry.body}</p>

                {entry.replies?.length ? (
                  <ul className="mt-2 flex flex-col gap-2 border-l border-[var(--border)] pl-3 ml-3">
                    {entry.replies.map((child) => (
                      <li key={child.id}>
                        <div className="flex items-center gap-2">
                          <Avatar name={child.author.name} src={child.author.avatar} size="xs" />
                          <span className="text-[12px] font-medium text-[var(--text)]">
                            {child.author.name}
                          </span>
                          <span className="flex-1" />
                          {child.author.id === user?.id ? (
                            <button
                              type="button"
                              aria-label="Delete reply"
                              onClick={() => void removeComment(child.id)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)]"
                            >
                              <TrashIcon size={12} />
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 pl-7 text-[12px] text-[var(--text)]">{child.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {/* Reply composer — threads onto the most recent comment */}
            {threadParentId ? (
              <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2">
                <Avatar name={user?.name ?? "Guest"} src={user?.avatar} size="sm" />
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void postComment(reply, threadParentId);
                    }
                  }}
                  placeholder="Leave a reply..."
                  aria-label="Leave a reply"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Send reply"
                  onClick={() => void postComment(reply, threadParentId)}
                  disabled={!reply.trim() || submitting}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40"
                >
                  <SendIcon size={14} />
                </button>
              </div>
            ) : null}
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
                    void postComment(comment);
                  }
                }}
                placeholder="Add a comment..."
                aria-label="Add a comment"
                className="min-w-0 flex-1 bg-transparent py-2 text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send comment"
                onClick={() => void postComment(comment)}
                disabled={!comment.trim() || submitting}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--text-subtle)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40"
              >
                <SendIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {panelOpen ? (
          <TaskDetailsPanel
            taskId={task.id}
            priority={task.priority}
            status={task.status}
            dueDate={task.dueDate}
            onChanged={reloadTask}
          />
        ) : null}
      </div>
    </div>
  );
}
