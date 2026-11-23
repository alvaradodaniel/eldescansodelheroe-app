import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/features/admin/pages";
import { AdminShell } from "@/features/admin/AdminShell";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminShell>
      <AdminDashboardPage />
    </AdminShell>
  ),
});
