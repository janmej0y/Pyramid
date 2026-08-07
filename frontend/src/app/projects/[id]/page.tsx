import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TasksView } from "@/components/tasks/tasks-view";
import { ChevronRightIcon } from "@/components/ui/icons";
import { projects } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

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
          <span className="truncate text-[var(--text)]">{project.name}</span>
        </nav>
      }
    >
      <TasksView />
    </AppShell>
  );
}
