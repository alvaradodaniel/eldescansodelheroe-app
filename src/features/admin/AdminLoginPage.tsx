import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAdmin, useAdminSession } from "./admin-auth";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (session.loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center px-5">
        <div
          className="h-24 w-full animate-pulse bg-card pixel-frame"
          aria-label="Verificando sesión"
        />
      </main>
    );
  }
  if (session.user && session.isAdmin) return <Navigate to="/admin" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInAdmin(email, password);
      await navigate({ to: "/admin", replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No pudimos iniciar sesión. Revisa tus datos.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="parchment-panel w-full max-w-md overflow-hidden pixel-frame-gold">
        <div className="wood-panel flex items-center gap-4 border-b-4 border-wood-dark px-6 py-5 text-cream sm:px-8">
          <span className="flex size-12 shrink-0 items-center justify-center border-2 border-gold/50 bg-wood-dark text-gold shadow-pixel-sm">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-pixel text-xs uppercase tracking-widest text-gold">Área privada</p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Acceso administrativo
            </h1>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-muted-foreground">Inicia sesión con una cuenta autorizada.</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <label className="block font-pixel text-sm" htmlFor="admin-email">
                Correo
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-pixel text-sm" htmlFor="admin-password">
                Contraseña
              </label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button variant="pixel-positive" className="w-full" type="submit" disabled={busy}>
              <LogIn aria-hidden="true" />
              {busy ? "Verificando…" : "Iniciar sesión"}
            </Button>
          </form>
          <Link
            to="/"
            className="mt-5 inline-block font-pixel text-sm text-primary hover:underline"
          >
            ← Volver a reservaciones
          </Link>
        </div>
      </section>
    </main>
  );
}
