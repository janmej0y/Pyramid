"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TasksView } from "@/components/tasks/tasks-view";
import { ChevronRightIcon } from "@/components/ui/icons";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

/**
 * A project's task board, with the project name in the topbar breadcrumb.
 */
export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { data: project } = useAsync(() => api.getProject(projectId), [projectId]);

  return (
    <AppShell
      breadcrumb={
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <Link
            href="/projects"
            className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            Projects
          </Link>
          <ChevronRightIcon size={13} className="shrink-0 text-[var(--text-subtle)]" />
          <span className="truncate text-[var(--text)]">{project?.name ?? "…"}</span>
        </nav>
      }
    >
      <TasksView projectId={projectId} />
    </AppShell>
  );
}
