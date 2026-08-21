"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { Avatar, AvatarAdd } from "@/components/ui/avatar";
import { PriorityChip } from "@/components/ui/chips";
import { InlineAdd, type InlineAddHandle } from "@/components/tasks/inline-add";
import { RowActions } from "@/components/tasks/row-actions";
import {
  DueDateCell,
  MembersCell,
  PriorityCell,
} from "@/components/tasks/cell-editors";
import { ProjectsTableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAsync, useDebounced } from "@/lib/hooks";
import { matchesFilters } from "@/lib/filters";
import { formatDateLong } from "@/lib/utils";
import { EMPTY_FILTERS } from "@/lib/types";
import type { FieldKey, Filters, Member, Priority } from "@/lib/types";

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
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const { showToast } = useToast();

  const debouncedSearch = useDebounced(search);
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), []);

  /** Surfaces a failed mutation instead of leaving the UI silently unchanged. */
  function reportFailure(action: string, err: unknown) {
    showToast({
      message: err instanceof Error ? `${action}: ${err.message}` : `${action} failed`,
      tone: "danger",
    });
  }

  // Lets the toolbar button open the inline field directly.
  const addRef = useRef<InlineAddHandle>(null);

  async function createProject(name: string) {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    try {
      await api.createProject({ name, dueDate: due.toISOString() });
      reload();
    } catch (err) {
      reportFailure("Could not create project", err);
    }
  }

  /** Deletes with an undo window that re-creates the project on demand. */
  async function deleteProject(id: string) {
    const original = data?.items.find((project) => project.id === id);

    try {
      await api.deleteProject(id);
      reload();
    } catch (err) {
      reportFailure("Could not delete project", err);
      return;
    }

    if (!original) return;

    showToast({
      message: `Deleted "${original.name}"`,
      actionLabel: "Undo",
      onAction: async () => {
        try {
          await api.createProject({
            name: original.name,
            priority: original.priority,
            dueDate: original.dueDate ?? undefined,
            leadId: original.lead?.id,
          });
          reload();
        } catch (err) {
          reportFailure("Could not restore project", err);
        }
      },
    });
  }

  async function changeProjectPriority(id: string, priority: Priority) {
    try {
      await api.updateProject(id, { priority });
      reload();
    } catch (err) {
      reportFailure("Could not change priority", err);
    }
  }

  /** Projects have a single lead, so only the first selection is kept. */
  async function changeProjectLead(id: string, memberIds: string[]) {
    try {
      await api.updateProject(id, { leadId: memberIds.at(-1) ?? null });
      reload();
    } catch (err) {
      reportFailure("Could not update lead", err);
    }
  }

  async function changeProjectDueDate(id: string, dueDate: string) {
    try {
      await api.updateProject(id, { dueDate });
      reload();
    } catch (err) {
      reportFailure("Could not update due date", err);
    }
  }

  /** The toolbar's "Add Project" opens the inline field at the table's foot. */
  function handleToolbarAdd() {
    addRef.current?.open();
  }

  /** Leads double as the member and reporter option sources. */
  const memberOptions = useMemo(() => {
    const members = new Map<string, Member>();
    for (const project of data?.items ?? []) {
      if (project.lead && !members.has(project.lead.id)) {
        members.set(project.lead.id, project.lead);
      }
    }
    return [...members.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const visible = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return (data?.items ?? []).filter((project) => {
      const byQuery = !query || project.name.toLowerCase().includes(query);
      return (
        byQuery &&
        matchesFilters(
          {
            priority: project.priority,
            members: project.lead ? [project.lead] : [],
            dueDate: project.dueDate ?? undefined,
            reporterId: project.lead?.id,
          },
          filters,
        )
      );
    });
  }, [data, debouncedSearch, filters]);

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
        filters={filters}
        onFiltersChange={setFilters}
        memberOptions={memberOptions}
        onAdd={handleToolbarAdd}
      />

      {error ? (
        <p role="alert" className="px-5 py-10 text-center text-[13px] text-[var(--danger-fg)]">
          {error}
        </p>
      ) : loading ? (
        <div className="px-4 pb-8 sm:px-5">
          <ProjectsTableSkeleton fields={fields} />
        </div>
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

                  {/* Editable in place, like the task table. */}
                  {fields.priority ? (
                    <div className="w-[88px] shrink-0">
                      <PriorityCell
                        priority={project.priority}
                        onChange={(next) =>
                          void changeProjectPriority(project.id, next)
                        }
                      />
                    </div>
                  ) : null}

                  {fields.members ? (
                    <div className="flex w-[76px] shrink-0 items-center">
                      <MembersCell
                        members={project.lead ? [project.lead] : []}
                        onChange={(ids) => void changeProjectLead(project.id, ids)}
                      />
                    </div>
                  ) : null}

                  {fields.dueDate ? (
                    <div className="w-[104px] shrink-0 text-[12.5px] text-[var(--text)]">
                      <DueDateCell
                        dueDate={project.dueDate ?? ""}
                        onChange={(iso) => void changeProjectDueDate(project.id, iso)}
                      />
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
            ref={addRef}
            label="Add Projects"
            placeholder="Project name"
            onSubmit={createProject}
            className={visible.length > 0 ? "border-t border-[var(--border)]" : undefined}
          />
        </div>
      </div>
      )}
    </>
  );
}
