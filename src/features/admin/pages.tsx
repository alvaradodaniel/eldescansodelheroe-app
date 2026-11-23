import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CheckCircle,
  Clock3,
  HelpCircle,
  LockKeyhole,
  PanelsTopLeft,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
  UsersRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  chihuahuaDateTimeToIso,
  getNextEventDateDefaults,
  RESTAURANT_TIMEZONE,
  toChihuahuaDateTimeInput,
} from "@/features/reservations/timezone";
import {
  adminCancelReservation,
  adminSaveEvent,
  adminSaveTable,
  getWeeklyTableTemplates,
  getAdminDashboardStats,
  saveWeeklyTableTemplates,
  subscribeAdminEvents,
  subscribeAdminEvent,
  subscribeAdminReservations,
  subscribeAdminTables,
  type AdminDashboardStats,
  type AdminEvent,
  type AdminReservation,
  type AdminTable,
  type Weekday,
  type WeeklyTableTemplate,
  type WeeklyTableTemplates,
} from "./admin-service";

const STATUSES = ["draft", "published", "closed", "cancelled"] as const;
const BANDS = [
  "band-provision",
  "band-banquete",
  "band-bestiario",
  "band-postres",
  "band-pociones",
  "band-lattes",
  "band-cafes",
  "band-otros",
  "band-temporada",
  "band-sylhar",
  "band-croacoco",
] as const;
const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];
const statusName: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  closed: "Cerrado",
  cancelled: "Cancelado",
  confirmed: "Confirmada",
  pending: "Pendiente",
};
const statusAppearance: Record<string, { className: string; Icon: LucideIcon }> = {
  draft: { className: "bg-gold/35 text-wood-dark", Icon: Clock3 },
  pending: { className: "bg-gold/35 text-wood-dark", Icon: Clock3 },
  published: { className: "bg-seat-open text-seat-open-foreground", Icon: CheckCircle },
  confirmed: { className: "bg-seat-open text-seat-open-foreground", Icon: CheckCircle },
  closed: { className: "bg-muted text-muted-foreground", Icon: LockKeyhole },
  cancelled: { className: "bg-destructive/15 text-destructive", Icon: XCircle },
};
const dateLabel = (value: { toDate(): Date } | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: RESTAURANT_TIMEZONE,
      }).format(value.toDate())
    : "—";

function AdminPage({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <div className="mb-8 border-b-2 border-gold-deep/35 pb-5">
        <p className="font-pixel text-xs uppercase tracking-[0.18em] text-primary">
          Administración
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getAdminDashboardStats()
      .then(setStats)
      .catch(() => setError("No pudimos cargar el resumen administrativo."));
  }, []);
  return (
    <AdminPage title="Tablón de mando" subtitle="Resumen de eventos y reservaciones.">
      {error && stats && (
        <p role="alert" className="mb-4 bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      )}
      {!stats && error ? (
        <p role="alert" className="bg-destructive/10 p-4 text-destructive">
          No se pudo cargar el resumen. {error}
        </p>
      ) : !stats ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Cargando resumen"
          aria-busy="true"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-card pixel-frame" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Eventos"
              value={stats.events}
              Icon={CalendarDays}
              accent="text-primary bg-primary/10"
            />
            <Metric
              label="Publicados"
              value={stats.published}
              Icon={CheckCircle}
              accent="text-seat-open bg-seat-open/10"
            />
            <Metric
              label="Próximos"
              value={stats.upcoming}
              Icon={Clock3}
              accent="text-gold-deep bg-gold/25"
            />
            <Metric
              label="Reservaciones confirmadas"
              value={stats.reservations}
              Icon={UsersRound}
              accent="text-seat-open bg-seat-open/10"
            />
            <Metric
              label="Lugares ocupados"
              value={stats.occupied}
              Icon={PanelsTopLeft}
              accent="text-primary bg-primary/10"
            />
            <Metric
              label="Lugares disponibles"
              value={stats.available}
              Icon={PanelsTopLeft}
              accent="text-gold-deep bg-gold/25"
            />
          </div>
          <section className="mt-8 bg-card p-5 pixel-frame">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <CalendarDays aria-hidden="true" className="size-5 text-primary" /> Eventos
                recientes
              </h2>
              <Link to="/admin/eventos" className="font-pixel text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {stats.recent.length ? (
              <ul className="mt-4 space-y-2">
                {stats.recent.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-gold-deep/55 bg-parchment/35 px-3 py-3 transition-colors hover:bg-parchment/70"
                  >
                    <div>
                      <Link
                        to="/admin/eventos/$eventoId"
                        params={{ eventoId: event.id }}
                        className="font-semibold text-primary hover:underline"
                      >
                        {event.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{dateLabel(event.startsAt)}</p>
                    </div>
                    <StatusBadge status={event.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted-foreground">Todavía no hay eventos.</p>
            )}
          </section>
        </>
      )}
    </AdminPage>
  );
}

function Metric({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-card p-4 pixel-frame">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[75%] font-pixel text-xs uppercase leading-relaxed tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border-2 border-wood-dark/10",
            accent,
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 font-display text-4xl font-bold leading-none">{value}</p>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const appearance = statusAppearance[status] ?? {
    className: "bg-secondary text-secondary-foreground",
    Icon: HelpCircle,
  };
  const Icon = appearance.Icon;
  const label = statusName[status] ?? status;
  return (
    <span
      aria-label={`Estado: ${label}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 font-pixel text-xs ${appearance.className}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(
    () =>
      subscribeAdminEvents(
        (items) => {
          setEvents(items);
          setLoading(false);
        },
        () => {
          setLoading(false);
          setError("No pudimos cargar los eventos.");
        },
      ),
    [],
  );
  return (
    <AdminPage
      title="Eventos"
      subtitle="Consulta y administra los eventos publicados y en preparación."
    >
      <div className="mb-5 flex justify-end">
        <Button variant="pixel-positive" asChild>
          <Link to="/admin/eventos/nuevo">
            <Plus aria-hidden="true" />
            Crear evento
          </Link>
        </Button>
      </div>
      {error && (
        <p role="alert" className="bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-40 animate-pulse bg-card pixel-frame" aria-label="Cargando eventos" />
      ) : events.length === 0 ? (
        <p className="bg-card p-5 pixel-frame">No hay eventos registrados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex flex-col bg-card pixel-frame transition-transform duration-200 hover:-translate-y-1"
            >
              <div
                className={
                  event.band +
                  " flex min-h-16 items-center border-b-4 border-wood-dark bg-band px-4 py-3 text-band-foreground"
                }
              >
                <h2 className="font-display text-xl font-bold leading-tight">{event.name}</h2>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-4">
                <div className="space-y-2">
                  <StatusBadge status={event.status} />
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CalendarDays
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{dateLabel(event.startsAt)} · hora de Chihuahua</span>
                  </p>
                </div>
                <Button variant="pixel-neutral" size="pixel-sm" asChild>
                  <Link to="/admin/eventos/$eventoId" params={{ eventoId: event.id }}>
                    <Settings2 aria-hidden="true" /> Administrar
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

export function AdminWeeklyTemplatesPage() {
  const [templates, setTemplates] = useState<WeeklyTableTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedDays, setExpandedDays] = useState<Set<Weekday>>(() => new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    getWeeklyTableTemplates()
      .then((value) => {
        if (active) setTemplates(value);
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "No se cargaron las plantillas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateTemplate(day: Weekday, id: string, changes: Partial<WeeklyTableTemplate>) {
    setTemplates((current) =>
      current
        ? {
            days: {
              ...current.days,
              [day]: current.days[day].map((row) => (row.id === id ? { ...row, ...changes } : row)),
            },
          }
        : current,
    );
  }

  function addTemplate(day: Weekday) {
    const row: WeeklyTableTemplate = {
      id: crypto.randomUUID(),
      name: "Mesa nueva",
      host: "",
      capacity: 4,
      status: "active",
      game: "",
      description: "",
      closedReason: "",
    };
    setExpandedDays((current) => new Set(current).add(day));
    setExpandedRows((current) => new Set(current).add(row.id));
    setTemplates((current) =>
      current
        ? {
            days: { ...current.days, [day]: [...current.days[day], row] },
          }
        : current,
    );
  }

  function removeTemplate(day: Weekday, id: string, name: string) {
    if (
      !window.confirm(
        `¿Eliminar “${name}” de la plantilla de ${WEEKDAYS.find((item) => item.key === day)?.label}? Los eventos existentes no cambiarán.`,
      )
    )
      return;
    setExpandedRows((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setTemplates((current) =>
      current
        ? {
            days: { ...current.days, [day]: current.days[day].filter((row) => row.id !== id) },
          }
        : current,
    );
  }

  async function save() {
    if (!templates) return;
    const invalidDay = WEEKDAYS.find(({ key }) =>
      templates.days[key].some(
        (row) =>
          !row.name.trim() ||
          !row.host.trim() ||
          !Number.isInteger(row.capacity) ||
          row.capacity < 1 ||
          row.capacity > 100,
      ),
    );
    if (invalidDay) {
      const message = `Revisa los nombres, Masters y capacidades de las mesas del ${invalidDay.label.toLowerCase()}.`;
      setError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveWeeklyTableTemplates(templates);
      toast.success("Plantillas semanales guardadas.");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "No se pudieron guardar las plantillas.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      title="Plantillas semanales"
      subtitle="Estas mesas se copian al crear un evento. Los eventos ya creados conservan sus propias mesas y anfitriones."
    >
      {loading ? (
        <div className="h-64 animate-pulse bg-card pixel-frame" aria-label="Cargando plantillas" />
      ) : error && !templates ? (
        <p role="alert" className="bg-destructive/10 p-4 text-destructive">
          {error}
        </p>
      ) : templates ? (
        <div className="space-y-4">
          {WEEKDAYS.map(({ key, label }) => (
            <section key={key} className="bg-card pixel-frame">
              <div className="flex items-start gap-2 sm:gap-3">
                <details
                  open={expandedDays.has(key)}
                  onToggle={(event) => {
                    const isOpen = event.currentTarget.open;
                    setExpandedDays((current) => {
                      const next = new Set(current);
                      if (isOpen) next.add(key);
                      else next.delete(key);
                      return next;
                    });
                  }}
                  className="min-w-0 flex-1"
                >
                  <summary className="flex min-w-0 flex-1 cursor-pointer list-none items-center gap-3 rounded-sm p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden sm:p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center border-2 border-wood-dark/15 bg-parchment text-primary">
                      <CalendarDays className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-xl font-bold">{label}</span>
                      <span className="block text-sm text-muted-foreground">
                        {templates.days[key].length}{" "}
                        {templates.days[key].length === 1
                          ? "mesa predeterminada"
                          : "mesas predeterminadas"}
                      </span>
                    </span>
                    <ChevronDown
                      className="accordion-chevron ml-auto size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="space-y-3 border-t-2 border-wood-dark/15 px-4 py-4 sm:px-5">
                    {templates.days[key].length === 0 ? (
                      <p className="border-2 border-dashed border-border p-4 text-sm text-muted-foreground">
                        Este día no tiene mesas predeterminadas. Agrega una para usarla al crear
                        eventos.
                      </p>
                    ) : (
                      templates.days[key].map((row) => (
                        <details
                          key={row.id}
                          open={expandedRows.has(row.id)}
                          onToggle={(event) => {
                            const isOpen = event.currentTarget.open;
                            setExpandedRows((current) => {
                              const next = new Set(current);
                              if (isOpen) next.add(row.id);
                              else next.delete(row.id);
                              return next;
                            });
                          }}
                          className="border-2 border-wood-dark/20 bg-background"
                        >
                          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden sm:px-4">
                            <span className="min-w-32 flex-1">
                              <span className="block font-display font-bold">
                                {row.name || "Mesa sin nombre"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {row.host || "Anfitrión pendiente"}
                              </span>
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {row.capacity} {row.capacity === 1 ? "lugar" : "lugares"}
                            </span>
                            <span
                              className={cn(
                                "border px-2 py-0.5 font-pixel text-[0.65rem] uppercase",
                                row.status === "active"
                                  ? "border-seat-open/30 bg-seat-open/10 text-seat-open"
                                  : "border-destructive/20 bg-destructive/10 text-destructive",
                              )}
                            >
                              {row.status === "active" ? "Activa" : "Desactivada"}
                            </span>
                            <ChevronDown
                              className="accordion-chevron size-4 text-primary"
                              aria-hidden="true"
                            />
                          </summary>
                          <div className="grid gap-4 border-t-2 border-wood-dark/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Nombre de mesa">
                              <Input
                                required
                                maxLength={100}
                                value={row.name}
                                onChange={(e) =>
                                  updateTemplate(key, row.id, { name: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="Master / anfitrión">
                              <Input
                                required
                                maxLength={100}
                                value={row.host}
                                onChange={(e) =>
                                  updateTemplate(key, row.id, { host: e.target.value })
                                }
                                placeholder="Nombre del Master"
                              />
                            </Field>
                            <Field label="Capacidad">
                              <Input
                                required
                                type="number"
                                min={1}
                                max={100}
                                value={row.capacity}
                                onChange={(e) =>
                                  updateTemplate(key, row.id, { capacity: Number(e.target.value) })
                                }
                              />
                            </Field>
                            <Field label="Juego">
                              <Input
                                maxLength={100}
                                value={row.game}
                                onChange={(e) =>
                                  updateTemplate(key, row.id, { game: e.target.value })
                                }
                              />
                            </Field>
                            <Field label="Estado">
                              <select
                                className="form-control w-full"
                                value={row.status}
                                onChange={(e) =>
                                  updateTemplate(key, row.id, {
                                    status: e.target.value as WeeklyTableTemplate["status"],
                                  })
                                }
                              >
                                <option value="active">Activa</option>
                                <option value="closed">Desactivada</option>
                              </select>
                            </Field>
                            {row.status === "closed" && (
                              <Field label="Motivo de desactivación">
                                <Input
                                  maxLength={200}
                                  value={row.closedReason}
                                  onChange={(e) =>
                                    updateTemplate(key, row.id, { closedReason: e.target.value })
                                  }
                                />
                              </Field>
                            )}
                            <div className="sm:col-span-2 lg:col-span-3">
                              <Field label="Descripción">
                                <textarea
                                  className="form-control min-h-16 w-full"
                                  maxLength={500}
                                  value={row.description}
                                  onChange={(e) =>
                                    updateTemplate(key, row.id, { description: e.target.value })
                                  }
                                />
                              </Field>
                            </div>
                            <div className="flex justify-end sm:col-span-2 lg:col-span-3">
                              <Button
                                variant="pixel-danger"
                                size="icon"
                                aria-label={`Eliminar ${row.name} de la plantilla`}
                                title={`Eliminar ${row.name} de la plantilla`}
                                onClick={() => removeTemplate(key, row.id, row.name)}
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        </details>
                      ))
                    )}
                  </div>
                </details>
                <Button
                  className="m-3 shrink-0 sm:m-4"
                  variant="pixel-positive"
                  size="pixel-sm"
                  disabled={templates.days[key].length >= 20}
                  title={
                    templates.days[key].length >= 20 ? "Máximo de 20 mesas por día" : undefined
                  }
                  onClick={() => addTemplate(key)}
                >
                  <Plus aria-hidden="true" />
                  Agregar mesa
                </Button>
              </div>
            </section>
          ))}
          {error && (
            <p role="alert" className="bg-destructive/10 p-3 text-destructive">
              {error}
            </p>
          )}
          <Button variant="pixel-positive" disabled={saving} onClick={() => void save()}>
            <Save aria-hidden="true" />
            {saving ? "Guardando…" : "Guardar todas las plantillas"}
          </Button>
        </div>
      ) : null}
    </AdminPage>
  );
}

function toInputDate(timestamp?: { toDate(): Date }): string {
  return timestamp ? toChihuahuaDateTimeInput(timestamp.toDate()) : "";
}

export function AdminEventEditorPage({ eventId }: { eventId?: string }) {
  const navigate = useNavigate();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(Boolean(eventId));
  useEffect(() => {
    if (!eventId) return;
    return subscribeAdminEvent(
      eventId,
      (item) => {
        setEvent(item);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [eventId]);
  if (loading)
    return (
      <AdminPage title="Editar evento">
        <div className="h-72 animate-pulse bg-card pixel-frame" aria-label="Cargando evento" />
      </AdminPage>
    );
  if (eventId && !event)
    return (
      <AdminPage title="Evento no encontrado">
        <Link to="/admin/eventos" className="text-primary underline">
          Volver a eventos
        </Link>
      </AdminPage>
    );
  return (
    <AdminPage
      title={event ? "Editar evento" : "Nuevo evento"}
      subtitle="Configura fechas, apertura, estado y apariencia."
    >
      <EventEditor
        key={event?.id ?? "new"}
        initial={event}
        onSaved={(id) => {
          toast.success("Evento guardado.");
          void navigate({ to: "/admin/eventos/$eventoId", params: { eventoId: id } });
        }}
      />
    </AdminPage>
  );
}

function EventEditor({
  initial,
  onSaved,
}: {
  initial: AdminEvent | null;
  onSaved: (id: string) => void;
}) {
  const [dateDefaults] = useState(() => getNextEventDateDefaults());
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(
    () => toInputDate(initial?.startsAt) || dateDefaults.startsAt,
  );
  const [opensAt, setOpensAt] = useState(
    () => toInputDate(initial?.opensAt) || dateDefaults.opensAt,
  );
  const [band, setBand] = useState(initial?.band ?? "band-provision");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const id = await adminSaveEvent({
        ...(initial ? { eventId: initial.id } : {}),
        name,
        description,
        startsAt: chihuahuaDateTimeToIso(startsAt),
        opensAt: chihuahuaDateTimeToIso(opensAt),
        band,
        status,
      });
      onSaved(id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar el evento.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5 bg-card p-5 pixel-frame sm:p-7">
      <div className="flex items-center gap-3 border-b-2 border-gold-deep/30 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center border-2 border-wood-dark/15 bg-parchment text-primary">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">Información del evento</h2>
          <p className="text-sm text-muted-foreground">
            Define cuándo se realizará y cómo aparecerá.
          </p>
        </div>
      </div>
      {!initial && (
        <p className="border-l-4 border-gold-deep bg-gold/15 p-3 text-sm leading-relaxed">
          Al crear este evento se copiarán las mesas y Masters de su día. Los cambios posteriores a
          la plantilla no alterarán este evento.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <Input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Fecha y hora del evento">
          <Input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="Apertura de reservaciones">
          <Input
            type="datetime-local"
            required
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
          />
        </Field>
        <Field label="Banda visual">
          <select
            className="form-control w-full"
            value={band}
            onChange={(e) => setBand(e.target.value)}
          >
            {BANDS.map((item) => (
              <option key={item} value={item}>
                {item.replace("band-", "")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select
            className="form-control w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusName[item]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Descripción">
        <textarea
          className="form-control min-h-28 w-full"
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="pixel-positive" type="submit" disabled={busy}>
          <Save aria-hidden="true" />
          {busy ? "Guardando…" : "Guardar evento"}
        </Button>
        <Button variant="pixel-danger" type="button" asChild>
          <Link to="/admin/eventos">
            <ArrowLeft aria-hidden="true" />
            Cancelar
          </Link>
        </Button>
      </div>
    </form>
  );
}

export function AdminEventDetailPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [tableEditor, setTableEditor] = useState<AdminTable | null | undefined>(undefined);
  const [savingStatus, setSavingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [reservationFilter, setReservationFilter] = useState("all");
  useEffect(() => {
    const loadedSources = new Set<string>();
    let active = true;
    setLoading(true);
    setEvent(null);
    setTables([]);
    setReservations([]);
    setLoadErrors([]);
    const loadingTimeoutMessage =
      "La carga está tardando más de lo esperado. Revisa la conexión con Firebase Emulator y vuelve a intentar.";
    const loadingTimeout = window.setTimeout(() => {
      if (active && loadedSources.size < 3) {
        setLoadErrors((current) => [...current, loadingTimeoutMessage]);
        setLoading(false);
      }
    }, 12_000);
    const markLoaded = (source: string, error?: Error) => {
      if (!active || loadedSources.has(source)) return;
      loadedSources.add(source);
      if (error) {
        setLoadErrors((current) => [
          ...current,
          error.message || "Error de conexión con Firestore.",
        ]);
      }
      if (loadedSources.size === 3) {
        window.clearTimeout(loadingTimeout);
        setLoadErrors((current) => current.filter((message) => message !== loadingTimeoutMessage));
        setLoading(false);
      }
    };
    const unsubs = [
      subscribeAdminEvent(
        eventId,
        (item) => {
          setEvent(item);
          markLoaded("event");
        },
        (error) => markLoaded("event", error),
      ),
      subscribeAdminTables(
        eventId,
        (items) => {
          setTables(items);
          markLoaded("tables");
        },
        (error) => markLoaded("tables", error),
      ),
      subscribeAdminReservations(
        eventId,
        (items) => {
          setReservations(items);
          markLoaded("reservations");
        },
        (error) => markLoaded("reservations", error),
      ),
    ];
    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [eventId]);
  const tableNames = useMemo(
    () => new Map(tables.map((table) => [table.id, table.name])),
    [tables],
  );
  const filteredReservations = useMemo(
    () =>
      reservations.filter(
        (item) =>
          (item.nickname ?? "").toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
          (tableFilter === "all" || item.tableId === tableFilter) &&
          (reservationFilter === "all" || item.status === reservationFilter),
      ),
    [reservations, search, tableFilter, reservationFilter],
  );
  async function setEventStatus(status: (typeof STATUSES)[number]) {
    if (!event) return;
    if (
      (status === "closed" || status === "cancelled") &&
      !window.confirm(`¿Confirmas cambiar el evento a ${statusName[status]?.toLowerCase()}?`)
    )
      return;
    setSavingStatus(true);
    try {
      await adminSaveEvent({
        eventId: event.id,
        name: event.name,
        description: event.description,
        startsAt: event.startsAt.toDate().toISOString(),
        opensAt: event.opensAt.toDate().toISOString(),
        band: event.band,
        status,
      });
      toast.success(`Evento ${statusName[status]?.toLowerCase() ?? status}.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo cambiar el estado.");
    } finally {
      setSavingStatus(false);
    }
  }
  async function cancel(uid: string, nickname: string) {
    if (!window.confirm(`¿Cancelar la reservación de ${nickname}?`)) return;
    try {
      await adminCancelReservation({ eventId, uid });
      toast.success("Reservación cancelada; se liberó un lugar.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo cancelar la reservación.");
    }
  }
  if (loading)
    return (
      <AdminPage title="Evento">
        <div className="h-80 animate-pulse bg-card pixel-frame" aria-label="Cargando evento" />
      </AdminPage>
    );
  if (!event)
    return (
      <AdminPage title={loadErrors.length ? "No se pudo cargar el evento" : "Evento no encontrado"}>
        {loadErrors.length > 0 && (
          <p role="alert" className="mb-4 bg-destructive/10 p-3 text-destructive">
            {loadErrors.join(" ")}
          </p>
        )}
        <Link to="/admin/eventos" className="text-primary underline">
          Volver a eventos
        </Link>
      </AdminPage>
    );
  return (
    <AdminPage title={event.name}>
      {loadErrors.length > 0 && (
        <p role="alert" className="mb-5 bg-destructive/10 p-3 text-destructive">
          Algunas secciones no pudieron cargarse: {loadErrors.join(" ")}
        </p>
      )}
      <section className={editing ? "" : "overflow-hidden bg-card pixel-frame"}>
        {!editing && <div className={cn("h-2 bg-band", event.band)} />}
        {editing ? (
          <EventEditor
            initial={event}
            onSaved={() => {
              setEditing(false);
              toast.success("Cambios guardados.");
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
              <div>
                <StatusBadge status={event.status} />
                {event.description && (
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="pixel-neutral"
                  size="icon"
                  aria-label="Editar detalles del evento"
                  title="Editar detalles del evento"
                  disabled={savingStatus}
                  onClick={() => setEditing(true)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <select
                  aria-label="Estado del evento"
                  className="form-control"
                  value={event.status}
                  disabled={savingStatus}
                  onChange={(e) => void setEventStatus(e.target.value as (typeof STATUSES)[number])}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {statusName[item]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <dl className="grid gap-3 border-t-2 border-wood-dark/10 bg-parchment/45 p-5 text-sm sm:grid-cols-2 sm:p-6">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <dt className="font-pixel text-xs uppercase tracking-wide text-muted-foreground">
                    Fecha del evento
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {dateLabel(event.startsAt)} · hora de Chihuahua
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <dt className="font-pixel text-xs uppercase tracking-wide text-muted-foreground">
                    Apertura de reservaciones
                  </dt>
                  <dd className="mt-1 font-semibold">{dateLabel(event.opensAt)}</dd>
                </div>
              </div>
            </dl>
          </>
        )}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <PanelsTopLeft aria-hidden="true" className="size-6 text-primary" /> Mesas
          </h2>
          <Button variant="pixel-positive" size="pixel-sm" onClick={() => setTableEditor(null)}>
            <Plus aria-hidden="true" />
            Crear mesa
          </Button>
        </div>
        {tableEditor !== undefined && (
          <div className="mb-5">
            <TableEditor
              key={tableEditor?.id ?? "new-table"}
              eventId={eventId}
              initial={tableEditor}
              onDone={() => setTableEditor(undefined)}
            />
          </div>
        )}
        {tables.length === 0 ? (
          <p className="bg-card p-4 pixel-frame">No hay mesas configuradas.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <article key={table.id} className="flex flex-col bg-card pixel-frame">
                <div className={cn("h-1.5 bg-band", event.band)} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{table.name}</h3>
                    <StatusBadge status={table.status === "active" ? "published" : "closed"} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="border-2 border-wood-dark/10 bg-parchment/70 px-2 py-2">
                      <p className="font-display text-xl font-bold">{table.reservedCount}</p>
                      <p className="font-pixel text-[0.6rem] uppercase text-muted-foreground">
                        Ocupados
                      </p>
                    </div>
                    <div className="border-2 border-seat-open/20 bg-seat-open/5 px-2 py-2">
                      <p className="font-display text-xl font-bold text-seat-open">
                        {Math.max(0, table.capacity - table.reservedCount)}
                      </p>
                      <p className="font-pixel text-[0.6rem] uppercase text-muted-foreground">
                        Libres
                      </p>
                    </div>
                    <div className="border-2 border-wood-dark/10 bg-parchment/70 px-2 py-2">
                      <p className="font-display text-xl font-bold">{table.capacity}</p>
                      <p className="font-pixel text-[0.6rem] uppercase text-muted-foreground">
                        Capacidad
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="font-semibold">Master / anfitrión:</span>{" "}
                    {table.host || "Por asignar"}
                  </p>
                  {table.game && <p className="mt-1 text-sm text-muted-foreground">{table.game}</p>}
                  <Button
                    variant="pixel-neutral"
                    size="icon"
                    aria-label={`Editar mesa ${table.name}`}
                    title={`Editar mesa ${table.name}`}
                    className="mt-3"
                    onClick={() => setTableEditor(table)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold">
          <UsersRound aria-hidden="true" className="size-6 text-primary" />
          Reservaciones{" "}
          <span className="font-sans text-base font-normal text-muted-foreground">
            ({reservations.filter((item) => item.status === "confirmed").length} confirmadas)
          </span>
        </h2>
        <div className="mb-4 grid gap-3 border-2 border-wood-dark/15 bg-card p-3 pixel-frame sm:grid-cols-3 sm:p-4">
          <Input
            aria-label="Buscar nickname"
            placeholder="Buscar nickname…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Filtrar por mesa"
            className="form-control w-full"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="all">Todas las mesas</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado"
            className="form-control w-full"
            value={reservationFilter}
            onChange={(e) => setReservationFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div className="space-y-3 md:hidden">
          {filteredReservations.map((item) => (
            <article key={item.uid} className="bg-card p-4 pixel-frame">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-display text-lg font-bold">{item.nickname}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tableNames.get(item.tableId) ?? "Mesa eliminada"}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-wood-dark/15 pt-3">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                  {dateLabel(item.createdAt)}
                </p>
                {item.status === "confirmed" && (
                  <Button
                    variant="pixel-danger"
                    size="icon"
                    aria-label={`Cancelar reservación de ${item.nickname}`}
                    title={`Cancelar reservación de ${item.nickname}`}
                    onClick={() => void cancel(item.uid, item.nickname)}
                  >
                    <XCircle aria-hidden="true" />
                  </Button>
                )}
              </div>
            </article>
          ))}
          {filteredReservations.length === 0 && (
            <p className="bg-card p-6 text-center text-muted-foreground pixel-frame">
              No hay reservaciones para esos filtros.
            </p>
          )}
        </div>
        <div className="hidden overflow-x-auto bg-card pixel-frame md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-wood-dark font-pixel text-cream">
              <tr>
                <th className="p-3">Nickname</th>
                <th className="p-3">Mesa</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((item) => (
                <tr
                  key={item.uid}
                  className="border-t border-border odd:bg-parchment/30 hover:bg-gold/10"
                >
                  <td className="p-3 font-semibold">{item.nickname}</td>
                  <td className="p-3">{tableNames.get(item.tableId) ?? "Mesa eliminada"}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3">{dateLabel(item.createdAt)}</td>
                  <td className="p-3">
                    {item.status === "confirmed" ? (
                      <Button
                        variant="pixel-danger"
                        size="icon"
                        aria-label={`Cancelar reservación de ${item.nickname}`}
                        title={`Cancelar reservación de ${item.nickname}`}
                        onClick={() => void cancel(item.uid, item.nickname)}
                      >
                        <XCircle aria-hidden="true" />
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No hay reservaciones para esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPage>
  );
}

function TableEditor({
  eventId,
  initial,
  onDone,
}: {
  eventId: string;
  initial: AdminTable | null;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 4));
  const [status, setStatus] = useState<"active" | "closed">(initial?.status ?? "active");
  const [game, setGame] = useState(initial?.game ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [closedReason, setClosedReason] = useState(initial?.closedReason ?? "");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!host.trim()) {
      toast.error("Indica el nombre del Master o anfitrión de la mesa.");
      return;
    }
    if (
      initial?.status === "active" &&
      status === "closed" &&
      !window.confirm("¿Desactivar esta mesa? Las reservaciones existentes se conservarán.")
    )
      return;
    setBusy(true);
    try {
      await adminSaveTable({
        eventId,
        ...(initial ? { tableId: initial.id } : {}),
        name,
        capacity: Number(capacity),
        status,
        game,
        host,
        description,
        closedReason,
      });
      toast.success("Mesa guardada.");
      onDone();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo guardar la mesa.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 border-t-4 border-wood-dark bg-parchment p-4 pixel-frame sm:grid-cols-2 sm:p-5"
    >
      <div className="flex items-center gap-3 border-b-2 border-gold-deep/30 pb-3 sm:col-span-2">
        <span className="flex size-10 shrink-0 items-center justify-center border-2 border-wood-dark/15 bg-cream text-primary">
          <PanelsTopLeft className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold">
            {initial ? "Editar mesa" : "Nueva mesa"}
          </h3>
          <p className="text-sm text-muted-foreground">Configura el espacio y quién lo dirige.</p>
        </div>
      </div>
      <Field label="Nombre">
        <Input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Capacidad">
        <Input
          required
          type="number"
          min={1}
          max={100}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </Field>
      <Field label="Estado">
        <select
          className="form-control w-full"
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "closed")}
        >
          <option value="active">Activa</option>
          <option value="closed">Desactivada</option>
        </select>
      </Field>
      <Field label="Juego">
        <Input value={game} maxLength={100} onChange={(e) => setGame(e.target.value)} />
      </Field>
      <Field label="Master / anfitrión">
        <Input required value={host} maxLength={100} onChange={(e) => setHost(e.target.value)} />
      </Field>
      <Field label="Motivo si está desactivada">
        <Input
          value={closedReason}
          maxLength={200}
          onChange={(e) => setClosedReason(e.target.value)}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Descripción">
          <textarea
            className="form-control min-h-20 w-full"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button variant="pixel-positive" type="submit" disabled={busy}>
          <Save aria-hidden="true" />
          {busy ? "Guardando…" : "Guardar mesa"}
        </Button>
        <Button
          variant="pixel-neutral"
          size="icon"
          type="button"
          aria-label="Cerrar editor de mesa"
          title="Cerrar editor de mesa"
          onClick={onDone}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 font-pixel text-sm">
      {label}
      {children}
    </label>
  );
}
