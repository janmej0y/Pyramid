"use client";

import { useMemo, useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";
import { boardColumns, listTasks, STATUS_GROUPS } from "@/lib/data";
import type { FieldKey, Priority, ViewMode } from "@/lib/types";

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

/** The list view repeats the same three rows under each status group. */
const LIST_GROUPS = ["To Do", "Doing", "Completed"] as const;

export function TasksView() {
  const [view, setView] = useState<ViewMode>("list");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  const query = search.trim().toLowerCase();

  const matches = useMemo(
    () =>
      function match(title: string, priority: Priority) {
        const byQuery = !query || title.toLowerCase().includes(query);
        const byPriority = !filterPriority || priority === filterPriority;
        return byQuery && byPriority;
      },
    [query, filterPriority],
  );

  const filteredGroups = useMemo(
    () =>
      LIST_GROUPS.map((group) => ({
        group,
        tasks: listTasks.filter((task) => matches(task.title, task.priority)),
      }))
        // A group with no matches is hidden entirely, as in the search screen.
        .filter((entry) => entry.tasks.length > 0),
    [matches],
  );

  const filteredColumns = useMemo(
    () =>
      boardColumns
        .map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => matches(task.title, task.priority)),
        }))
        .filter((column) => column.tasks.length > 0),
    [matches],
  );

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

      {view === "list" ? (
        <div className="px-4 pb-8 sm:px-5">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((entry) => (
              <TaskTable
                key={entry.group}
                group={entry.group}
                tasks={entry.tasks}
                fields={fields}
                linkPrefix="/tasks"
              />
            ))
          ) : (
            <p className="py-10 text-center text-[13px] text-[var(--text-muted)]">
              No tasks found.
            </p>
          )}
        </div>
      ) : (
        <TaskBoard columns={filteredColumns} />
      )}
    </>
  );
}

export { STATUS_GROUPS };
