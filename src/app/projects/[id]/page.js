import ProjectDetail from "@/components/ProjectDetail";
import AuthGate from "@/components/AuthGate";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  return (
    <AuthGate>
      <ProjectDetail id={id} />
    </AuthGate>
  );
}
