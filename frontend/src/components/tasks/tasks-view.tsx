"use client";

import { useMemo, useRef, useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskBoardSkeleton, TaskTableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import type { InlineAddHandle } from "@/components/tasks/inline-add";
import { api, type ApiTask } from "@/lib/api";
import { useAsync, useDebounced } from "@/lib/hooks";
import { STATUS_OPTIONS } from "@/lib/constants";
import { matchesFilters } from "@/lib/filters";
import { countFilters, EMPTY_FILTERS } from "@/lib/types";
import type { FieldKey, Filters, Member, Priority, Task, ViewMode } from "@/lib/types";

/** Default column visibility — matches the checked state in the Fields menu. */
const DEFAULT_FIELDS: Record<FieldKey, boolean> = {
  priority: true,
  members: true,
  dueDate: true,
  assignees: true,
  labels: false,
  status: false,
  reporter: false,
};

/** Maps an API task onto the shape the presentational components expect. */
function toTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    members: task.members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
    })),
    dueDate: task.dueDate ?? "",
    labels: task.labels,
    projectId: task.projectId ?? undefined,
  };
}

export function TasksView({ projectId }: { projectId?: string } = {}) {
  const [view, setView] = useState<ViewMode>("list");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const { showToast } = useToast();

  // Debounced so typing in the toolbar doesn't fire a request per keystroke.
  const debouncedSearch = useDebounced(search);

  // Inline-add handles keyed by status, so the toolbar can open the first
  // rendered group's field directly rather than dispatching a DOM click.
  const addHandles = useRef(new Map<string, InlineAddHandle>());

  const { data, loading, error, reload } = useAsync(
    () => api.groupedTasks(projectId),
    [projectId],
  );

  /** Surfaces a failed mutation instead of leaving the UI silently unchanged. */
  function reportFailure(action: string, err: unknown) {
    showToast({
      message: err instanceof Error ? `${action}: ${err.message}` : `${action} failed`,
      tone: "danger",
    });
  }

  // Every mutation re-fetches the grouped payload, which keeps the list and
  // board consistent without duplicating optimistic-update logic per view.
  async function createTask(status: string, title: string) {
    // Default to a week out so new cards aren't missing a due date, which the
    // design always shows.
    const due = new Date();
    due.setDate(due.getDate() + 7);

    try {
      await api.createTask({
        title,
        status,
        projectId,
        dueDate: due.toISOString(),
      });
      reload();
    } catch (err) {
      reportFailure("Could not create task", err);
    }
  }

  /**
   * Deletes with an undo window.
   *
   * The task is removed server-side immediately — an undo toast that recreates
   * on demand is simpler and more honest than a soft-delete flag the API does
   * not model. Undo re-creates the task with its original fields.
   */
  async function deleteTask(id: string) {
    const original = data
      ?.flatMap((group) => group.items)
      .find((task) => task.id === id);

    try {
      await api.deleteTask(id);
      reload();
    } catch (err) {
      reportFailure("Could not delete task", err);
      return;
    }

    if (!original) return;

    showToast({
      message: `Deleted "${original.title}"`,
      actionLabel: "Undo",
      onAction: async () => {
        try {
          await api.createTask({
            title: original.title,
            description: original.description ?? undefined,
            status: original.status,
            priority: original.priority,
            projectId: original.projectId ?? undefined,
            dueDate: original.dueDate ?? undefined,
            assigneeIds: original.members.map((member) => member.id),
            labels: original.labels,
          });
          reload();
        } catch (err) {
          reportFailure("Could not restore task", err);
        }
      },
    });
  }

  async function changeStatus(id: string, status: string) {
    try {
      await api.updateTask(id, { status });
      reload();
    } catch (err) {
      reportFailure("Could not move task", err);
    }
  }

  async function changePriority(id: string, priority: Priority) {
    try {
      await api.updateTask(id, { priority });
      reload();
    } catch (err) {
      reportFailure("Could not change priority", err);
    }
  }

  async function changeMembers(id: string, memberIds: string[]) {
    try {
      await api.updateTask(id, { assigneeIds: memberIds });
      reload();
    } catch (err) {
      reportFailure("Could not update members", err);
    }
  }

  async function changeDueDate(id: string, dueDate: string) {
    try {
      await api.updateTask(id, { dueDate });
      reload();
    } catch (err) {
      reportFailure("Could not update due date", err);
    }
  }

  // Filter option sources are derived from the loaded payload, so the menu only
  // ever offers values that exist in the data.
  const { memberOptions, labelOptions } = useMemo(() => {
    const members = new Map<string, Member>();
    const labels = new Set<string>();

    for (const group of data ?? []) {
      for (const task of group.items) {
        for (const member of task.members) {
          if (!members.has(member.id)) members.set(member.id, member);
        }
        if (task.reporter && !members.has(task.reporter.id)) {
          members.set(task.reporter.id, task.reporter);
        }
        for (const label of task.labels) labels.add(label);
      }
    }

    return {
      memberOptions: [...members.values()].sort((a, b) => a.name.localeCompare(b.name)),
      labelOptions: [...labels].sort((a, b) => a.localeCompare(b)),
    };
  }, [data]);

  // Search and filters are applied client-side against the already grouped
  // payload, keeping the board and list in sync without a refetch.
  const groups = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const byStatus = new Map(data?.map((g) => [g.status, g.items]) ?? []);

    // Always render every column, so an empty one still offers "Add Task".
    // While filtering, empty groups are hidden — matching the search screen.
    const filtering = Boolean(query) || countFilters(filters) > 0;

    return STATUS_OPTIONS.map((status) => ({
      status,
      items: (byStatus.get(status) ?? [])
        .filter((task) => {
          const byQuery = !query || task.title.toLowerCase().includes(query);
          return (
            byQuery &&
            matchesFilters(
              {
                status: task.status,
                priority: task.priority,
                members: task.members,
                labels: task.labels,
                dueDate: task.dueDate ?? undefined,
                reporterId: task.reporter?.id,
              },
              filters,
            )
          );
        })
        .map(toTask),
    })).filter((group) => !filtering || group.items.length > 0);
  }, [data, debouncedSearch, filters]);

  const isFiltering = Boolean(debouncedSearch.trim()) || countFilters(filters) > 0;

  /**
   * The toolbar's "Add Task" opens the first group's inline field rather than a
   * modal, since the design has no create dialog. Declared after `groups` so
   * the React Compiler can still memoize that computation.
   */
  function handleToolbarAdd() {
    const first = groups[0]?.status;
    if (first) addHandles.current.get(first)?.open();
  }

  return (
    <>
      <PageToolbar
        title="Tasks"
        addLabel="Add Task"
        showViewSwitch
        view={view}
        onViewChange={setView}
        fields={fields}
        onFieldChange={(key, value) => setFields((prev) => ({ ...prev, [key]: value }))}
        search={search}
        onSearchChange={setSearch}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={STATUS_OPTIONS}
        memberOptions={memberOptions}
        labelOptions={labelOptions}
        onAdd={handleToolbarAdd}
      />

      {error ? (
        <p role="alert" className="px-5 py-10 text-center text-[13px] text-[var(--danger-fg)]">
          {error}
        </p>
      ) : loading ? (
        // Shaped placeholders at the real row height, so arriving data doesn't
        // shift the layout — most visible during the Atlas cold start.
        view === "list" ? (
          <div className="px-4 pb-8 sm:px-5">
            {STATUS_OPTIONS.slice(0, 3).map((status) => (
              <TaskTableSkeleton key={status} fields={fields} />
            ))}
          </div>
        ) : (
          <TaskBoardSkeleton />
        )
      ) : groups.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-[var(--text-muted)]">
          {isFiltering ? "No tasks match your filters." : "No tasks yet."}
        </p>
      ) : view === "list" ? (
        <div className="px-4 pb-8 sm:px-5">
          {groups.map((group) => (
            <TaskTable
              key={group.status}
              /*
               * Handles are registered by status, so the toolbar can open a
               * specific group's field regardless of render order.
               */
              ref={(handle) => {
                if (handle) addHandles.current.set(group.status, handle);
                else addHandles.current.delete(group.status);
              }}
              group={group.status}
              tasks={group.items}
              fields={fields}
              linkPrefix="/tasks"
              onAdd={(title) => createTask(group.status, title)}
              onDelete={deleteTask}
              onStatusChange={changeStatus}
              onPriorityChange={changePriority}
              onMembersChange={changeMembers}
              onDueDateChange={changeDueDate}
            />
          ))}
        </div>
      ) : (
        <TaskBoard
          // The board owns all its columns, so a single handle for the first
          // column is enough — keyed the same way for a consistent lookup.
          ref={(handle) => {
            const first = groups[0]?.status;
            if (!first) return;
            if (handle) addHandles.current.set(first, handle);
            else addHandles.current.delete(first);
          }}
          columns={groups.map((group) => ({
            status: group.status,
            tasks: group.items,
          }))}
          onAdd={createTask}
          onDelete={deleteTask}
          onStatusChange={changeStatus}
          onPriorityChange={changePriority}
        />
      )}
    </>
  );
}
