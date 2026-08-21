"use client";

import { useMemo, useRef, useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import type { InlineAddHandle } from "@/components/tasks/inline-add";
import { api, type ApiTask } from "@/lib/api";
import { useAsync, useDebounced } from "@/lib/hooks";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { FieldKey, Priority, Task, ViewMode } from "@/lib/types";

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
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  // Debounced so typing in the toolbar doesn't fire a request per keystroke.
  const debouncedSearch = useDebounced(search);

  // Inline-add handles keyed by status, so the toolbar can open the first
  // rendered group's field directly rather than dispatching a DOM click.
  const addHandles = useRef(new Map<string, InlineAddHandle>());

  const { data, loading, error, reload } = useAsync(
    () => api.groupedTasks(projectId),
    [projectId],
  );

  // Every mutation re-fetches the grouped payload, which keeps the list and
  // board consistent without duplicating optimistic-update logic per view.
  async function createTask(status: string, title: string) {
    // Default to a week out so new cards aren't missing a due date, which the
    // design always shows.
    const due = new Date();
    due.setDate(due.getDate() + 7);

    await api.createTask({
      title,
      status,
      projectId,
      dueDate: due.toISOString(),
    });
    reload();
  }

  async function deleteTask(id: string) {
    await api.deleteTask(id);
    reload();
  }

  async function changeStatus(id: string, status: string) {
    await api.updateTask(id, { status });
    reload();
  }

  async function changePriority(id: string, priority: Priority) {
    await api.updateTask(id, { priority });
    reload();
  }

  async function changeMembers(id: string, memberIds: string[]) {
    await api.updateTask(id, { assigneeIds: memberIds });
    reload();
  }

  async function changeDueDate(id: string, dueDate: string) {
    await api.updateTask(id, { dueDate });
    reload();
  }

  // Search and priority filters are applied client-side against the already
  // grouped payload, keeping the board and list in sync without a refetch.
  const groups = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const byStatus = new Map(data?.map((g) => [g.status, g.items]) ?? []);

    // Always render every column, so an empty one still offers "Add Task".
    // While filtering, empty groups are hidden — matching the search screen.
    const filtering = Boolean(query || filterPriority);

    return STATUS_OPTIONS.map((status) => ({
      status,
      items: (byStatus.get(status) ?? [])
        .filter((task) => {
          const byQuery = !query || task.title.toLowerCase().includes(query);
          const byPriority = !filterPriority || task.priority === filterPriority;
          return byQuery && byPriority;
        })
        .map(toTask),
    })).filter((group) => !filtering || group.items.length > 0);
  }, [data, debouncedSearch, filterPriority]);

  const isFiltering = Boolean(debouncedSearch.trim() || filterPriority);

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
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        onAdd={handleToolbarAdd}
      />

      {error ? (
        <p role="alert" className="px-5 py-10 text-center text-[13px] text-[var(--danger-fg)]">
          {error}
        </p>
      ) : loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-[var(--text-muted)]">
          Loading tasks…
        </p>
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
