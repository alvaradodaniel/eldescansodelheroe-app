import { createFileRoute } from "@tanstack/react-router";
import { AdminEventEditorPage } from "@/features/admin/pages";
import { AdminShell } from "@/features/admin/AdminShell";

export const Route = createFileRoute("/admin/eventos/nuevo")({
  component: () => (
    <AdminShell>
      <AdminEventEditorPage />
    </AdminShell>
  ),
});
