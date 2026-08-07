import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { TaskDetailView } from "@/components/tasks/task-detail-view";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequireAuth>
      <AppShell>
        <TaskDetailView taskId={id} />
      </AppShell>
    </RequireAuth>
  );
}
