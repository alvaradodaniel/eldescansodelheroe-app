import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdminWeeklyTemplatesPage } from "@/features/admin/pages";

export const Route = createFileRoute("/admin/plantillas")({
  component: () => (
    <AdminShell>
      <AdminWeeklyTemplatesPage />
    </AdminShell>
  ),
});
