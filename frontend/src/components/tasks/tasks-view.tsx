"use client";

import { useMemo, useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import { api, type ApiTask } from "@/lib/api";
import { useAsync, useDebounced } from "@/lib/hooks";
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

  const { data, loading, error } = useAsync(
    () => api.groupedTasks(projectId),
    [projectId],
  );

  // Search and priority filters are applied client-side against the already
  // grouped payload, keeping the board and list in sync without a refetch.
  const groups = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return (data ?? [])
      .map((group) => ({
        status: group.status,
        items: group.items
          .filter((task) => {
            const byQuery = !query || task.title.toLowerCase().includes(query);
            const byPriority = !filterPriority || task.priority === filterPriority;
            return byQuery && byPriority;
          })
          .map(toTask),
      }))
      .filter((group) => group.items.length > 0);
  }, [data, debouncedSearch, filterPriority]);

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
          No tasks found.
        </p>
      ) : view === "list" ? (
        <div className="px-4 pb-8 sm:px-5">
          {groups.map((group) => (
            <TaskTable
              key={group.status}
              group={group.status}
              tasks={group.items}
              fields={fields}
              linkPrefix="/tasks"
            />
          ))}
        </div>
      ) : (
        <TaskBoard
          columns={groups.map((group) => ({
            status: group.status,
            tasks: group.items,
          }))}
        />
      )}
    </>
  );
}
