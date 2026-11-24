import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  LoaderCircle,
  PencilLine,
  UserRound,
} from "lucide-react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Countdown } from "@/features/reservations/components/Countdown";
import { TableCard, TableCardSkeleton } from "@/features/reservations/components/TableCard";
import { useEvent } from "@/features/reservations/firebase/use-event";
import { useEventTables } from "@/features/reservations/firebase/use-event-tables";
import {
  toGameTable,
  toReservationEvent,
} from "@/features/reservations/firebase/reservation-adapters";
import {
  cancelReservation,
  reservationErrorMessage,
  reserveSeat,
  subscribeOwnReservation,
  type ActiveReservation,
} from "@/features/reservations/firebase/reservation-service";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getTableState } from "@/features/reservations/table-state";
import { getTableBand } from "@/features/reservations/visual-bands";
import {
  isEventPubliclyVisible,
  PUBLIC_EVENT_RETENTION_MS,
} from "@/features/reservations/event-lifecycle";

export const Route = createFileRoute("/eventos/$eventoId")({ component: EventRoute });

function EventRoute() {
  const { eventoId } = Route.useParams();
  return <EventPage key={eventoId} eventoId={eventoId} />;
}

function readSavedNickname(): string {
  try {
    return typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem("reservation-nickname") ?? "");
  } catch {
    return "";
  }
}

function saveNickname(nickname: string): void {
  try {
    window.localStorage.setItem("reservation-nickname", nickname);
  } catch {
    // Remembering a nickname is optional and must not affect a confirmed reservation.
  }
}

function EventPage({ eventoId }: { eventoId: string }) {
  const auth = useAuthUser();
  const eventState = useEvent(eventoId);
  const eventId = eventState.event?.id ?? null;
  const opensAtMillis = eventState.event?.opensAt.toMillis() ?? null;
  const startsAtMillis = eventState.event?.startsAt.toMillis() ?? null;
  const [clientTime, setClientTime] = useState(() => Date.now());
  const tableState = useEventTables(eventId);
  const event = eventState.event ? toReservationEvent(eventState.event, clientTime) : null;
  const tables = useMemo(() => tableState.tables.map(toGameTable), [tableState.tables]);
  const [nickname, setNickname] = useState(readSavedNickname);
  const [nicknameEditing, setNicknameEditing] = useState(!readSavedNickname());
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const reserveObservedRef = useRef(false);
  const cancelObservedRef = useRef(false);
  const reservePendingRef = useRef(false);
  const cancelPendingRef = useRef(false);
  const [reservation, setReservation] = useState<ActiveReservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [submittingTableId, setSubmittingTableId] = useState<string | null>(null);

  useEffect(() => {
    const nextBoundary = [
      opensAtMillis,
      startsAtMillis,
      startsAtMillis === null ? null : startsAtMillis + PUBLIC_EVENT_RETENTION_MS,
    ]
      .filter((value): value is number => value !== null && value > Date.now())
      .sort((a, b) => a - b)[0];
    if (nextBoundary === undefined) return;
    const timer = window.setTimeout(
      () => setClientTime(Date.now()),
      Math.min(nextBoundary - Date.now(), 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [opensAtMillis, startsAtMillis]);

  useEffect(() => {
    reservePendingRef.current = false;
    cancelPendingRef.current = false;
    reserveObservedRef.current = false;
    cancelObservedRef.current = false;
    if (!eventId || !auth.uid) {
      setReservationLoading(false);
      return;
    }
    setReservationLoading(true);
    return subscribeOwnReservation(
      eventId,
      auth.uid,
      (ownReservation) => {
        if (ownReservation?.status === "cancelled") {
          setReservation(null);
          setReservationLoading(false);
          if (cancelPendingRef.current) {
            cancelObservedRef.current = true;
            cancelPendingRef.current = false;
            toast.success("Tu reserva fue cancelada y el lugar quedó disponible.", {
              duration: 5000,
            });
          }
          return;
        }
        setReservation(ownReservation);
        setReservationLoading(false);
        if (ownReservation?.status === "confirmed" && reservePendingRef.current) {
          reserveObservedRef.current = true;
          reservePendingRef.current = false;
          toast.success("¡Tu lugar quedó confirmado! La reserva activa aparece en esta página.", {
            duration: 5000,
          });
        }
      },
      () => {
        setReservationLoading(false);
        toast.error("No pudimos consultar tu reserva. Recarga para volver a intentarlo.", {
          duration: 6500,
        });
      },
    );
  }, [eventId, auth.uid]);

  async function submitReservation(tableId: string) {
    if (reservationLoading) return;
    if (reservation) {
      toast.warning(
        reservation.tableId === tableId
          ? "Ya perteneces a esta mesa."
          : "Ya te encuentras en otra mesa y no puedes reservar en más de una mesa del mismo evento.",
        { duration: 5500 },
      );
      return;
    }
    const cleanNickname = nickname.trim();
    if (cleanNickname.length < 2) {
      setNicknameEditing(true);
      toast.warning("Antes de reservar, escribe y guarda tu nombre o alias.", { duration: 5500 });
      return;
    }
    if (!event || !available || !auth.uid || busyRef.current) return;
    busyRef.current = true;
    reservePendingRef.current = true;
    reserveObservedRef.current = false;
    setBusy(true);
    setSubmittingTableId(tableId);
    try {
      await reserveSeat({
        eventId: event.id,
        tableId,
        nickname: cleanNickname,
      });
      reservePendingRef.current = false;
      saveNickname(cleanNickname);
      setNicknameEditing(false);
      if (!reserveObservedRef.current) {
        toast.success(
          `¡Reserva confirmada en ${tables.find((table) => table.id === tableId)?.name ?? "la mesa"}!`,
          { duration: 5000 },
        );
      }
    } catch (error) {
      if (!reserveObservedRef.current) {
        const errorMessage = reservationErrorMessage(error);
        toast.error(errorMessage, { duration: 6500 });
      }
      reservePendingRef.current = false;
    } finally {
      busyRef.current = false;
      setBusy(false);
      setSubmittingTableId(null);
    }
  }

  async function submitCancellation() {
    if (!event || !auth.uid || busyRef.current) return;
    busyRef.current = true;
    cancelPendingRef.current = true;
    cancelObservedRef.current = false;
    setBusy(true);
    try {
      await cancelReservation({ eventId: event.id });
      cancelPendingRef.current = false;
      if (!cancelObservedRef.current) {
        toast.success("Tu reserva fue cancelada y el lugar quedó disponible.", { duration: 5000 });
      }
      setCancelAsk(false);
    } catch (error) {
      if (!cancelObservedRef.current) {
        const errorMessage = reservationErrorMessage(error);
        toast.error(errorMessage, { duration: 6500 });
      }
      cancelPendingRef.current = false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const activeTable = reservation ? tables.find((table) => table.id === reservation.tableId) : null;
  const available = event ? event.status === "open" : false;
  const eventExpired =
    eventState.event !== null &&
    !isEventPubliclyVisible(eventState.event.startsAt.toDate(), clientTime);

  return (
    <>
      <Toaster position="bottom-center" toastOptions={{ duration: 4500 }} />
      {event?.status === "open" && (
        <div className="pointer-events-none fixed right-3 top-[4.5rem] z-30 sm:right-6">
          <p
            role="status"
            aria-label="Disponibilidad en vivo"
            className="inline-flex items-center gap-2 border-2 border-wood-dark bg-wood-dark/95 px-3 py-1.5 font-pixel text-xs text-cream shadow-lg sm:text-sm"
          >
            <span className="size-2.5 bg-seat-open animate-live" aria-hidden="true" />
            Disponibilidad en vivo
          </p>
        </div>
      )}
      <AppHeader />
      <main>
        {eventState.loading ? (
          <div aria-label="Cargando evento" aria-busy="true">
            <section className="relative isolate overflow-hidden">
              <img
                src="/images/brand/mesa-de-juego.webp"
                alt=""
                className="pixelated absolute inset-0 -z-20 h-full w-full object-cover"
              />
              <div className="absolute inset-0 -z-10 night-veil" />
              <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-6 md:pb-14 md:pt-10">
                <div className="h-8 w-36 animate-pulse border-2 border-cream/20 bg-wood-dark/70 shadow-pixel-sm" />
                <div className="mt-5 h-12 w-2/3 max-w-3xl animate-pulse bg-cream/20 sm:h-14" />
                <div className="mt-4 h-5 w-1/2 max-w-2xl animate-pulse bg-cream/15" />
                <div className="mt-6 grid max-w-3xl gap-3 border-2 border-gold/30 bg-wood-dark/80 p-4 shadow-pixel-sm sm:grid-cols-2 sm:gap-0 sm:p-5">
                  {[0, 1].map((item) => (
                    <div
                      key={item}
                      className="space-y-2 border-b border-cream/15 pb-3 last:border-0 last:pb-0 sm:border-b-0 sm:pb-0 sm:pr-5"
                    >
                      <div className="h-3 w-32 animate-pulse bg-gold/30" />
                      <div className="h-4 w-4/5 animate-pulse bg-cream/20" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="mx-auto mt-10 max-w-6xl px-5 sm:px-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="h-8 w-28 animate-pulse bg-wood-dark/10" />
                <div className="h-4 w-16 animate-pulse bg-wood-dark/10" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <TableCardSkeleton key={index} />
                ))}
              </div>
            </section>
          </div>
        ) : eventState.error ? (
          <StateMessage text="No pudimos cargar este evento. Comprueba tu conexión e inténtalo de nuevo." />
        ) : eventExpired ? (
          <StateMessage text="Este evento terminó hace más de dos días y ya no está disponible." />
        ) : !event ? (
          <StateMessage text="Este evento no existe o ya no está publicado." />
        ) : (
          <>
            <section
              className={`relative isolate overflow-hidden ${event.band} ${event.past ? "grayscale" : ""}`}
            >
              <img
                src="/images/brand/mesa-de-juego.webp"
                alt=""
                width={1280}
                height={896}
                className="pixelated absolute inset-0 -z-20 h-full w-full object-cover"
              />
              <div className="absolute inset-0 -z-10 night-veil" />
              <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-6 md:pb-14 md:pt-10">
                <Link
                  to="/"
                  hash="eventos"
                  className="inline-flex items-center gap-2 border-2 border-cream/30 bg-wood-dark/65 px-3 py-1.5 font-pixel text-xs text-cream shadow-pixel-sm transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Todos los eventos
                </Link>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-cream text-shadow-pixel sm:text-5xl md:text-6xl">
                  {event.name}
                </h1>
                {event.description && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream drop-shadow sm:text-lg">
                    {event.description}
                  </p>
                )}
                <div className="mt-6 grid max-w-3xl gap-3 border-2 border-gold/50 bg-wood-dark/85 p-4 text-cream shadow-pixel-sm sm:grid-cols-2 sm:gap-0 sm:p-5">
                  <div className="flex items-start gap-3 border-b border-cream/20 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                    <div>
                      <p className="font-pixel text-xs uppercase tracking-wider text-gold">
                        Fecha del evento
                      </p>
                      <p className="mt-1 font-semibold leading-snug">
                        {event.dateLabel} <span className="text-cream/60">·</span> {event.timeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-1 sm:pl-5 sm:pt-0">
                    <Clock3 className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                    <div>
                      <p className="font-pixel text-xs uppercase tracking-wider text-gold">
                        Apertura de reservaciones
                      </p>
                      <p className="mt-1 font-semibold leading-snug">{event.opensAtLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {auth.loading ? (
              <p className="mx-auto mt-5 max-w-6xl px-5 sm:px-6">Preparando tu sesión segura…</p>
            ) : auth.error ? (
              <StateMessage text="No pudimos iniciar tu sesión. Recarga la página para reintentar." />
            ) : null}
            {reservation && (
              <section className="mx-auto mt-6 max-w-6xl px-5 sm:px-6">
                <div className="border-2 border-seat-open bg-card p-5 pixel-frame">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-seat-open">
                        Tienes una reserva activa
                      </h2>
                      <p className="mt-1">
                        {event.name} · {activeTable?.name ?? "Mesa reservada"} ·{" "}
                        {reservation.nickname}
                      </p>
                    </div>
                    {event.past ? (
                      <p className="border-l-4 border-muted-foreground/40 pl-3 text-sm text-muted-foreground">
                        El evento ya pasó; la reservación quedó como registro.
                      </p>
                    ) : cancelAsk ? (
                      <div>
                        <p>¿Confirmas que quieres cancelar tu reserva?</p>
                        <div className="mt-3 flex gap-3">
                          <Button
                            variant="pixel-danger"
                            disabled={busy}
                            onClick={submitCancellation}
                          >
                            {busy ? "Procesando…" : "Sí, cancelar"}
                          </Button>
                          <Button
                            variant="pixel-neutral"
                            disabled={busy}
                            onClick={() => setCancelAsk(false)}
                          >
                            Volver
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="pixel-danger"
                        disabled={busy}
                        onClick={() => setCancelAsk(true)}
                      >
                        Cancelar reserva
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}
            <section className="mx-auto mt-6 max-w-6xl px-5 sm:px-6">
              {event.past ? (
                <div className="border-y-2 border-wood-dark/20 bg-muted/45 py-4">
                  <p className="font-display text-xl font-bold text-muted-foreground">
                    Este evento ya pasó
                  </p>
                  <p className="text-muted-foreground">Las reservaciones están cerradas.</p>
                </div>
              ) : event.status === "published" ? (
                <div className="border-y-2 border-gold-deep/40 py-5 text-center">
                  <p className="font-pixel text-sm uppercase tracking-widest text-primary">
                    Las reservaciones abren en
                  </p>
                  <div className="mx-auto mt-4 max-w-md">
                    <Countdown targetAt={eventState.event!.opensAt.toDate()} />
                  </div>
                </div>
              ) : event.status === "closed" || event.status === "cancelled" ? (
                <div className="border-y border-wood-dark/20 py-4">
                  <p className="font-display text-xl font-bold">
                    {event.status === "cancelled" ? "Evento cancelado" : "Reservaciones cerradas"}
                  </p>
                  <p className="text-muted-foreground">
                    Este evento no recibe nuevas reservaciones.
                  </p>
                </div>
              ) : (
                <div className="border-y border-wood-dark/20 py-4">
                  <div>
                    <p className="font-display text-xl font-bold">¡Reservaciones abiertas!</p>
                    <p className="text-muted-foreground">Elige una mesa y confirma tu lugar.</p>
                  </div>
                </div>
              )}
            </section>
            <section className="mx-auto mt-10 max-w-6xl px-5 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Mesas</h2>
                <span className="font-pixel text-sm text-muted-foreground">
                  {tables.length} mesas
                </span>
              </div>
              {tableState.loading ? (
                <div
                  className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  aria-label="Cargando mesas"
                  aria-busy="true"
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <TableCardSkeleton key={index} />
                  ))}
                </div>
              ) : tableState.error ? (
                <StateMessage text="No pudimos actualizar las mesas. Revisa tu conexión e inténtalo de nuevo." />
              ) : tables.length === 0 ? (
                <p className="py-8 text-muted-foreground">
                  Este evento todavía no tiene mesas publicadas.
                </p>
              ) : (
                <>
                  {!event.past && (
                    <>
                      <div className="parchment-panel pixel-frame mt-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center bg-secondary text-secondary-foreground">
                            <UserRound className="size-5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-display text-lg font-bold">
                              ¿Con qué nombre reservamos?
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lo usarás para identificar tu lugar en el evento.
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:max-w-sm sm:flex-row">
                          <input
                            aria-label="Nombre o alias"
                            className="form-control min-w-0 flex-1"
                            value={nickname}
                            maxLength={30}
                            autoComplete="nickname"
                            disabled={!nicknameEditing || busy}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ej. Sir Galahad"
                          />
                          <Button
                            className="my-auto"
                            variant={nicknameEditing ? "pixel-positive" : "pixel-neutral"}
                            disabled={busy || (nicknameEditing && nickname.trim().length < 2)}
                            onClick={() => {
                              if (!nicknameEditing) {
                                setNicknameEditing(true);
                                return;
                              }
                              const clean = nickname.trim();
                              setNickname(clean);
                              saveNickname(clean);
                              setNicknameEditing(false);
                            }}
                          >
                            {nicknameEditing ? (
                              "Guardar nombre"
                            ) : (
                              <>
                                <PencilLine className="size-4" aria-hidden="true" />
                                Editar nombre
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {nickname.trim().length < 2 && (
                        <p className="mt-3 text-sm text-destructive">
                          Escribe un nombre de al menos 2 caracteres para elegir una mesa.
                        </p>
                      )}
                    </>
                  )}
                  {auth.uid && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tables.map((table, index) => {
                        const state = getTableState(table, event.status);
                        return (
                          <TableCard
                            key={table.id}
                            table={table}
                            state={state}
                            bandClass={getTableBand(index)}
                            selected={
                              submittingTableId === table.id || reservation?.tableId === table.id
                            }
                            {...(reservation ? { reservationTableId: reservation.tableId } : {})}
                            pending={submittingTableId === table.id}
                            disabled={busy || reservationLoading || !available}
                            onSelect={() => void submitReservation(table.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
            {busy && submittingTableId && (
              <p className="sr-only" role="status">
                <LoaderCircle className="animate-spin" />
                Confirmando la reserva…
              </p>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </>
  );
}

function StateMessage({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="mx-auto mt-6 flex max-w-6xl items-center gap-2 bg-card p-4 text-destructive pixel-frame"
    >
      <AlertCircle className="size-5" />
      {text}
    </p>
  );
}
