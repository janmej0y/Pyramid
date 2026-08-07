import { AppShell } from "@/components/layout/app-shell";
import { TaskDetailView } from "@/components/tasks/task-detail-view";
import { boardColumns, detailTask, listTasks } from "@/lib/data";

const allTasks = [...boardColumns.flatMap((column) => column.tasks), ...listTasks];

export function generateStaticParams() {
  return allTasks.map((task) => ({ id: task.id }));
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Unknown ids fall back to the design's reference task rather than 404ing,
  // since every card in the seed data links here.
  const task = allTasks.find((t) => t.id === id);

  return (
    <AppShell>
      <TaskDetailView title={task?.title ?? detailTask.title} />
    </AppShell>
  );
}
