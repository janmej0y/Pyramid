import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata = { title: "Tasks · Pyramid" };

export default function TasksPage() {
  return (
    <RequireAuth>
      <AppShell>
        <TasksView />
      </AppShell>
    </RequireAuth>
  );
}
