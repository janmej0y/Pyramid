import { RequireAuth } from "@/components/auth/require-auth";
import { ProjectDetailView } from "@/components/projects/project-detail-view";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequireAuth>
      <ProjectDetailView projectId={id} />
    </RequireAuth>
  );
}
