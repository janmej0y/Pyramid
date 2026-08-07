import { AppShell } from "@/components/layout/app-shell";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata = { title: "Tasks · Pyramid" };

export default function TasksPage() {
  return (
    <AppShell>
      <TasksView />
    </AppShell>
  );
}
