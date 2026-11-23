import { createFileRoute } from "@tanstack/react-router";
import { AdminEventsPage } from "@/features/admin/pages";
import { AdminShell } from "@/features/admin/AdminShell";

export const Route = createFileRoute("/admin/eventos/")({
  component: () => (
    <AdminShell>
      <AdminEventsPage />
    </AdminShell>
  ),
});
