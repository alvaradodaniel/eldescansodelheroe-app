import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LogOut, LayoutDashboard, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AppFooter } from "@/components/layout/AppFooter";
import { cn } from "@/lib/utils";
import { signOutAdmin, useAdminSession } from "./admin-auth";
import { AdminConfirmProvider } from "./AdminConfirmProvider";
import { useAdminConfirm } from "./admin-confirm-context";

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (session.loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-16">
        <div className="h-24 animate-pulse bg-card pixel-frame" aria-label="Verificando acceso" />
      </main>
    );
  }
  if (!session.user || !session.isAdmin) {
    if (!session.user) return <Navigate to="/admin/login" replace />;
    return (
      <AdminConfirmProvider>
        <main className="mx-auto mt-16 max-w-xl bg-card p-6 text-center pixel-frame">
          <h1 className="font-display text-2xl font-bold">Acceso restringido</h1>
          <p className="mt-2">Esta cuenta no tiene permisos administrativos.</p>
          <LogoutControl variant="pixel-neutral" className="mt-5" />
        </main>
      </AdminConfirmProvider>
    );
  }
  const navClass = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-2 rounded-none border-2 px-3 py-2 font-pixel text-xs shadow-pixel-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      active
        ? "border-gold border-b-4 border-b-cream bg-gold text-wood-dark"
        : "border-cream/30 bg-wood-dark/45 text-cream hover:border-gold hover:bg-wood-dark hover:text-gold",
    );
  return (
    <AdminConfirmProvider>
      <div className="flex min-h-screen flex-col">
        <Toaster richColors position="top-right" />
        <header className="wood-panel border-b-4 border-wood-dark">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div>
              <Link to="/admin" className="font-display text-xl font-bold text-cream">
                El Descanso · Admin
              </Link>
              <p className="max-w-[16rem] truncate font-pixel text-xs text-gold">
                {session.user.email}
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Administración">
              <Link to="/admin" className={navClass(pathname === "/admin")}>
                <LayoutDashboard className="size-4" aria-hidden="true" /> Inicio
              </Link>
              <Link to="/admin/eventos" className={navClass(pathname.startsWith("/admin/eventos"))}>
                <ScrollText className="size-4" aria-hidden="true" /> Eventos
              </Link>
              <Link
                to="/admin/plantillas"
                className={navClass(pathname.startsWith("/admin/plantillas"))}
              >
                <CalendarDays className="size-4" aria-hidden="true" /> Plantillas
              </Link>
              <LogoutControl variant="pixel-danger" iconOnly />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
        <AppFooter />
      </div>
    </AdminConfirmProvider>
  );
}

function LogoutControl({
  className,
  variant = "ghost",
  iconOnly = false,
}: {
  className?: string;
  variant?: "ghost" | "pixel-neutral" | "pixel-danger";
  iconOnly?: boolean;
}) {
  const confirm = useAdminConfirm();

  async function requestLogout() {
    const confirmed = await confirm({
      title: "¿Cerrar sesión?",
      description: "Tendrás que iniciar sesión otra vez para volver al panel administrativo.",
      confirmLabel: "Cerrar sesión",
      cancelLabel: "Seguir aquí",
      destructive: true,
    });
    if (confirmed) await signOutAdmin();
  }

  return (
    <Button
      variant={variant}
      size={iconOnly ? "icon" : undefined}
      className={cn(iconOnly && "rounded-none border-2 border-cream/30 shadow-pixel-sm", className)}
      aria-label={iconOnly ? "Cerrar sesión" : undefined}
      title={iconOnly ? "Cerrar sesión" : undefined}
      onClick={() => void requestLogout()}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {!iconOnly && "Cerrar sesión"}
    </Button>
  );
}
