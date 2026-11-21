import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, PencilLine, UserRound } from "lucide-react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Countdown } from "@/features/reservations/components/Countdown";
import { TableCard } from "@/features/reservations/components/TableCard";
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
  const [message, setMessage] = useState("");
  const [reservation, setReservation] = useState<ActiveReservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [submittingTableId, setSubmittingTableId] = useState<string | null>(null);

  useEffect(() => {
    if (opensAtMillis === null || opensAtMillis <= Date.now()) return;
    let timer = 0;
    const updateAtOpen = () => {
      const remaining = opensAtMillis - Date.now();
      if (remaining <= 0) {
        setClientTime(Date.now());
        return;
      }
      timer = window.setTimeout(updateAtOpen, Math.min(remaining, 2_147_000_000));
    };
    updateAtOpen();
    return () => window.clearTimeout(timer);
  }, [opensAtMillis]);

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
            setMessage("Tu reserva fue cancelada y el lugar quedó disponible.");
          }
          return;
        }
        setReservation(ownReservation);
        setReservationLoading(false);
        if (ownReservation?.status === "confirmed" && reservePendingRef.current) {
          reserveObservedRef.current = true;
          reservePendingRef.current = false;
          setMessage("¡Tu lugar quedó confirmado! La reserva activa aparece en esta página.");
          toast.success("¡Tu reserva quedó confirmada!");
        }
      },
      () => {
        setReservationLoading(false);
        setMessage("No pudimos consultar tu reserva. Recarga para volver a intentarlo.");
      },
    );
  }, [eventId, auth.uid]);

  async function submitReservation(tableId: string) {
    const cleanNickname = nickname.trim();
    if (cleanNickname.length < 2) {
      setNicknameEditing(true);
      toast.error("Antes de reservar, escribe y guarda tu nombre o alias.");
      return;
    }
    if (
      !event ||
      reservation ||
      reservationLoading ||
      !auth.uid ||
      busyRef.current
    )
      return;
    busyRef.current = true;
    reservePendingRef.current = true;
    reserveObservedRef.current = false;
    setBusy(true);
    setSubmittingTableId(tableId);
    setMessage("");
    try {
      await reserveSeat({
        eventId: event.id,
        tableId,
        nickname: cleanNickname,
      });
      reservePendingRef.current = false;
      saveNickname(cleanNickname);
      setNicknameEditing(false);
      setMessage("¡Tu lugar quedó confirmado! La reserva activa aparece en esta página.");
      if (!reserveObservedRef.current) {
        toast.success(`¡Reserva confirmada en ${tables.find((table) => table.id === tableId)?.name ?? "la mesa"}!`);
      }
    } catch (error) {
      if (!reserveObservedRef.current) {
        const errorMessage = reservationErrorMessage(error);
        setMessage(errorMessage);
        toast.error(errorMessage);
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
    setMessage("");
    try {
      await cancelReservation({ eventId: event.id });
      cancelPendingRef.current = false;
      setMessage("Tu reserva fue cancelada y el lugar quedó disponible.");
      toast.success("Tu reserva fue cancelada.");
      setCancelAsk(false);
    } catch (error) {
      if (!cancelObservedRef.current) {
        const errorMessage = reservationErrorMessage(error);
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
      cancelPendingRef.current = false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const activeTable = reservation ? tables.find((table) => table.id === reservation.tableId) : null;
  const available = event ? event.status === "open" : false;

  return (
    <>
      <AppHeader />
      <main>
        {eventState.loading ? (
          <div
            className="mx-auto max-w-6xl space-y-4 px-5 py-12 sm:px-6"
            aria-label="Cargando evento"
            aria-busy="true"
          >
            <div className="h-10 w-2/3 animate-pulse bg-muted" />
            <div className="h-5 w-1/2 animate-pulse bg-muted" />
            <div className="h-24 animate-pulse bg-muted" />
          </div>
        ) : eventState.error ? (
          <StateMessage text="No pudimos cargar este evento. Comprueba tu conexión e inténtalo de nuevo." />
        ) : !event ? (
          <StateMessage text="Este evento no existe o ya no está publicado." />
        ) : (
          <>
            <section className={`relative isolate overflow-hidden ${event.band}`}>
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
                  className="font-pixel text-sm text-cream/80 hover:text-gold"
                >
                  ◂ Todos los eventos
                </Link>
                <p className="mt-6 inline-block bg-band px-2 py-0.5 font-pixel text-sm uppercase tracking-widest text-band-foreground">
                  {event.tagline}
                </p>
                <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-cream text-shadow-pixel sm:text-5xl">
                  {event.name}
                </h1>
                <p className="mt-3 max-w-2xl text-cream/90">{event.description}</p>
                <div className="mt-6 flex flex-wrap gap-2 font-pixel text-sm">
                  <span className="bg-wood-dark/85 px-3 py-1.5 text-cream">
                    ✦ {event.dateLabel} · {event.timeLabel}
                  </span>
                  <span className="bg-wood-dark/85 px-3 py-1.5 text-cream">
                    ◷ Reservaciones: {event.opensAtLabel}
                  </span>
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
                <h2 className="text-xl font-bold">Tienes una reserva activa</h2>
                <p className="mt-1">
                  {event.name} · {activeTable?.name ?? "Mesa reservada"} · {reservation.nickname}
                </p>
                {cancelAsk ? (
                  <div className="mt-4">
                    <p>¿Confirmas que quieres cancelar tu reserva?</p>
                    <div className="mt-3 flex gap-3">
                      <Button variant="pixel" disabled={busy} onClick={submitCancellation}>
                        {busy ? "Procesando…" : "Sí, cancelar"}
                      </Button>
                      <Button
                        variant="pixel-dark"
                        disabled={busy}
                        onClick={() => setCancelAsk(false)}
                      >
                        Volver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="mt-4"
                    variant="pixel-dark"
                    disabled={busy}
                    onClick={() => setCancelAsk(true)}
                  >
                    Cancelar reserva
                  </Button>
                )}
                </div>
              </section>
            )}
            {message && (
              <p role="status" className="mx-auto mt-5 max-w-6xl px-5 sm:px-6">
                <span className="block bg-card p-4 pixel-frame">{message}</span>
              </p>
            )}
            <section className="mx-auto mt-6 max-w-6xl px-5 sm:px-6">
              {event.status === "published" ? (
                <div className="parchment-panel pixel-frame-gold px-4 py-5 text-center">
                  <p className="font-pixel text-sm uppercase tracking-widest text-primary">
                    Las reservaciones abren en
                  </p>
                  <div className="mx-auto mt-4 max-w-md">
                    <Countdown targetAt={eventState.event!.opensAt.toDate()} />
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Puedes revisar las mesas. La apertura es {event.opensAtLabel}, hora de
                    Chihuahua.
                  </p>
                </div>
              ) : event.status === "closed" || event.status === "cancelled" ? (
                <div className="bg-card px-4 py-4 pixel-frame">
                  <p className="font-display text-xl font-bold">
                    {event.status === "cancelled" ? "Evento cancelado" : "Reservaciones cerradas"}
                  </p>
                  <p className="text-muted-foreground">
                    Este evento no recibe nuevas reservaciones.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 bg-card px-4 py-4 pixel-frame sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-bold">¡Reservaciones abiertas!</p>
                    <p className="text-muted-foreground">Elige una mesa y confirma tu lugar.</p>
                  </div>
                  <p className="inline-flex items-center gap-2 self-start bg-wood-dark px-3 py-1.5 font-pixel text-sm text-cream">
                    <span className="size-2.5 bg-seat-open animate-live" aria-hidden />
                    Disponibilidad en vivo
                  </p>
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
                    <div key={index} className="h-52 animate-pulse bg-card pixel-frame" />
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
                  <div className="parchment-panel pixel-frame mt-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center bg-secondary text-secondary-foreground">
                        <UserRound className="size-5" aria-hidden />
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
                    {nicknameEditing ? (
                      <div className="flex w-full flex-col gap-2 sm:max-w-sm sm:flex-row">
                        <input
                          aria-label="Nombre o alias"
                          className="h-11 min-w-0 flex-1 pixel-input px-3"
                          value={nickname}
                          maxLength={30}
                          autoComplete="nickname"
                          disabled={busy}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Ej. Sir Galahad"
                        />
                        <Button
                          variant="pixel"
                          disabled={nickname.trim().length < 2 || busy}
                          onClick={() => {
                            const clean = nickname.trim();
                            setNickname(clean);
                            saveNickname(clean);
                            setNicknameEditing(false);
                          }}
                        >
                          Guardar nombre
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{nickname}</span>
                        <Button
                          variant="pixel-dark"
                          className="h-9 w-auto px-3 text-sm"
                          disabled={busy}
                          onClick={() => setNicknameEditing(true)}
                        >
                          <PencilLine className="mr-1 size-4" aria-hidden />
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                {nickname.trim().length < 2 && (
                    <p className="mt-3 text-sm text-destructive">
                      Escribe un nombre de al menos 2 caracteres para elegir una mesa.
                    </p>
                  )}
                {auth.uid && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tables.map((table) => {
                        const state = getTableState(table, event.status);
                        return (
                          <TableCard
                            key={table.id}
                            table={table}
                            state={state}
                        selected={submittingTableId === table.id || reservation?.tableId === table.id}
                        pending={submittingTableId === table.id}
                            disabled={
                              busy ||
                              reservationLoading ||
                              Boolean(reservation) ||
                              !available
                            }
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
            {event.status === "published" && (
              <p className="mt-6 bg-card p-4 pixel-frame">
                Las reservaciones todavía no abren. Puedes consultar las mesas; vuelve después de la
                hora de apertura.
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
