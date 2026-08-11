"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { Avatar, AvatarAdd } from "@/components/ui/avatar";
import { PriorityChip } from "@/components/ui/chips";
import { InlineAdd } from "@/components/tasks/inline-add";
import { RowActions } from "@/components/tasks/row-actions";
import { api } from "@/lib/api";
import { useAsync, useDebounced } from "@/lib/hooks";
import { formatDateLong } from "@/lib/utils";
import type { FieldKey, Priority } from "@/lib/types";

const DEFAULT_FIELDS: Record<FieldKey, boolean> = {
  priority: true,
  members: true,
  dueDate: true,
  assignees: true,
  labels: false,
  status: false,
  reporter: false,
};

export function ProjectsView() {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  const debouncedSearch = useDebounced(search);
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), []);

  async function createProject(name: string) {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    await api.createProject({ name, dueDate: due.toISOString() });
    reload();
  }

  async function deleteProject(id: string) {
    await api.deleteProject(id);
    reload();
  }

  async function changeProjectPriority(id: string, priority: Priority) {
    await api.updateProject(id, { priority });
    reload();
  }

  function focusFirstAdd() {
    const target = document.querySelector<HTMLElement>("[data-add-target]");
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    target?.click();
  }

  const visible = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return (data?.items ?? []).filter((project) => {
      const byQuery = !query || project.name.toLowerCase().includes(query);
      const byPriority = !filterPriority || project.priority === filterPriority;
      return byQuery && byPriority;
    });
  }, [data, debouncedSearch, filterPriority]);

  return (
    <>
      <PageToolbar
        title="Projects"
        addLabel="Add Project"
        fields={fields}
        onFieldChange={(key, value) => setFields((prev) => ({ ...prev, [key]: value }))}
        search={search}
        onSearchChange={setSearch}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        onAdd={focusFirstAdd}
      />

      {error ? (
        <p role="alert" className="px-5 py-10 text-center text-[13px] text-[var(--danger-fg)]">
          {error}
        </p>
      ) : loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-[var(--text-muted)]">
          Loading projects…
        </p>
      ) : (
      <div className="px-4 pb-8 sm:px-5">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="hidden items-center gap-3 border-b border-[var(--border)] bg-[var(--table-head-bg)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-muted)] md:flex">
            <span className="min-w-0 flex-1">Projects</span>
            {fields.priority ? <span className="w-[88px] shrink-0">Priority</span> : null}
            {fields.members ? <span className="w-[76px] shrink-0">Lead</span> : null}
            {fields.dueDate ? <span className="w-[104px] shrink-0">Due Date</span> : null}
            <span className="w-[52px] shrink-0 text-right">Actions</span>
          </div>

          <ul>
            {visible.map((project) => (
              <li
                key={project.id}
                className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--hover)]"
              >
                {/* Desktop row */}
                <div className="hidden items-center gap-3 px-4 py-2.5 md:flex">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="truncate text-[13px] text-[var(--text)] hover:underline"
                    >
                      {project.name}
                    </Link>
                  </div>

                  {fields.priority ? (
                    <div className="w-[88px] shrink-0">
                      <PriorityChip priority={project.priority} />
                    </div>
                  ) : null}

                  {fields.members ? (
                    <div className="flex w-[76px] shrink-0 items-center">
                      {project.lead ? (
                        <Avatar name={project.lead.name} src={project.lead.avatar} size="sm" />
                      ) : (
                        <AvatarAdd size="sm" />
                      )}
                    </div>
                  ) : null}

                  {fields.dueDate ? (
                    <div className="w-[104px] shrink-0 text-[12.5px] text-[var(--text)]">
                      {project.dueDate ? formatDateLong(project.dueDate) : "—"}
                    </div>
                  ) : null}

                  <div className="flex w-[52px] shrink-0 justify-end">
                    <RowActions
                      label={project.name}
                      priority={project.priority}
                      showStatus={false}
                      onPriorityChange={(priority) =>
                        void changeProjectPriority(project.id, priority)
                      }
                      onDelete={() => void deleteProject(project.id)}
                    />
                  </div>
                </div>

                {/* Mobile stacked card */}
                <div className="flex items-start gap-3 px-3 py-3 md:hidden">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="truncate text-[13px] text-[var(--text)] hover:underline"
                    >
                      {project.name}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {fields.priority ? <PriorityChip priority={project.priority} /> : null}
                      {fields.dueDate && project.dueDate ? (
                        <span className="text-[11.5px] text-[var(--text-muted)]">
                          {formatDateLong(project.dueDate)}
                        </span>
                      ) : null}
                      {fields.members ? (
                        project.lead ? (
                          <Avatar name={project.lead.name} src={project.lead.avatar} size="xs" />
                        ) : (
                          <AvatarAdd size="xs" />
                        )
                      ) : null}
                    </div>
                  </div>
                  <RowActions
                    label={project.name}
                    priority={project.priority}
                    showStatus={false}
                    onPriorityChange={(priority) =>
                      void changeProjectPriority(project.id, priority)
                    }
                    onDelete={() => void deleteProject(project.id)}
                  />
                </div>
              </li>
            ))}
          </ul>

          <InlineAdd
            label="Add Projects"
            placeholder="Project name"
            onSubmit={createProject}
            addTarget
            className={visible.length > 0 ? "border-t border-[var(--border)]" : undefined}
          />
        </div>
      </div>
      )}
    </>
  );
}
