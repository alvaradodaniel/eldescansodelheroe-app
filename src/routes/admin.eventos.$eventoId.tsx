import { createFileRoute } from "@tanstack/react-router";
import { AdminEventDetailPage } from "@/features/admin/pages";
import { AdminShell } from "@/features/admin/AdminShell";

export const Route = createFileRoute("/admin/eventos/$eventoId")({
  component: EventAdminRoute,
});

function EventAdminRoute() {
  const { eventoId } = Route.useParams();
  return (
    <AdminShell>
      <AdminEventDetailPage eventId={eventoId} />
    </AdminShell>
  );
}
