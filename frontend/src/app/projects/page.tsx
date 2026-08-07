import { AppShell } from "@/components/layout/app-shell";
import { ProjectsView } from "@/components/projects/projects-view";

export const metadata = { title: "Projects · Pyramid" };

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsView />
    </AppShell>
  );
}
