import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { ConfirmationView } from "@/features/reservations/components/ConfirmationView";
import { Countdown } from "@/features/reservations/components/Countdown";
import { DemoStateBar } from "@/features/reservations/components/DemoStateBar";
import { ReservationPanel } from "@/features/reservations/components/ReservationPanel";
import { TableCard } from "@/features/reservations/components/TableCard";
import { findMockEvent } from "@/features/reservations/mock-data";
import { eventSeatTotals } from "@/features/reservations/table-state";
import type { EventStatus, ReservationEvent } from "@/features/reservations/types";
import { useMockReservation } from "@/features/reservations/use-mock-reservation";
import { cn } from "@/lib/utils";

const TABLE_URL = "/images/brand/mesa-de-juego.webp";

export const Route = createFileRoute("/eventos/$eventoId")({
  loader: ({ params }) => {
    const event = findMockEvent(params.eventoId);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event;
    const title = event
      ? `${event.name} · Reservaciones`
      : "Evento no disponible · El Descanso del Héroe";
    const description = event
      ? `${event.tagline}. ${event.dateLabel}, ${event.timeLabel}. Reservaciones: ${event.opensAtLabel} (hora de Chihuahua).`
      : "Este evento no existe o ya no está disponible.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(event ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: EventPage,
  notFoundComponent: EventNotFound,
});

function EventPage() {
  const { event } = Route.useLoaderData();
  return <EventView key={event.id} event={event} />;
}

function EventView({ event }: { event: ReservationEvent }) {
  const [status, setStatus] = useState<EventStatus>(event.status);
  const r = useMockReservation(event, status);
  const totals = eventSeatTotals(r.tables.map((t) => t.table));

  return (
    <>
      <AppHeader />
      <main className={cn(r.selected && r.phase.kind !== "confirmed" && "pb-80")}>
        {r.phase.kind === "confirmed" ? (
          <ConfirmationView
            event={event}
            table={r.phase.table}
            seatNumber={r.phase.seatNumber}
            alias={r.phase.alias}
            serverTime={r.phase.serverTime}
            onBack={r.reset}
          />
        ) : (
          <>
            <EventHero event={event} />
            <DemoStateBar value={status} onChange={setStatus} />

            <section className="mx-auto max-w-6xl px-5 pt-6 sm:px-6">
              {status === "published" && <PreOpeningPanel event={event} />}
              {status === "open" && (
                <div className="flex flex-col gap-3 bg-card px-4 py-4 pixel-frame sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-bold">¡Reservaciones abiertas!</p>
                    <p className="text-muted-foreground">
                      {totals.left} de {totals.capacity} lugares libres · elige una mesa para
                      continuar
                    </p>
                  </div>
                  <p className="inline-flex items-center gap-2 self-start bg-wood-dark px-3 py-1.5 font-pixel text-sm text-cream sm:self-auto">
                    <span className="size-2.5 bg-seat-open animate-live" aria-hidden />
                    Disponibilidad en vivo
                  </p>
                </div>
              )}
              {status === "closed" && (
                <div className="bg-card px-4 py-4 pixel-frame">
                  <p className="font-display text-xl font-bold">Reservaciones cerradas</p>
                  <p className="text-muted-foreground">
                    Este evento ya no recibe reservaciones. Síguenos en redes para enterarte del
                    próximo.
                  </p>
                </div>
              )}
            </section>

            <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-6">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-2xl font-bold sm:text-3xl">Mesas</h2>
                <p className="font-pixel text-sm text-muted-foreground">
                  {event.tables.length} mesas
                </p>
              </div>
              <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {r.tables.map(({ table, state }) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    state={state}
                    selected={r.selected?.id === table.id}
                    flash={r.flashId === table.id}
                    onSelect={r.select}
                  />
                ))}
              </div>
            </section>

            {r.selected && (
              <ReservationPanel
                table={r.selected}
                alias={r.alias}
                phase={r.phase}
                alternatives={r.alternatives}
                onAliasChange={r.setAlias}
                onReserve={r.reserve}
                onClose={r.clearSelection}
                onPickAlternative={r.select}
              />
            )}
          </>
        )}
      </main>
      <AppFooter />
    </>
  );
}

function EventHero({ event }: { event: ReservationEvent }) {
  return (
    <section className={cn("relative isolate overflow-hidden", event.band)}>
      <img
        src={TABLE_URL}
        alt=""
        width={1280}
        height={896}
        className="pixelated absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 night-veil" />
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-6 md:pb-14 md:pt-10">
        <Link to="/" hash="eventos" className="font-pixel text-sm text-cream/80 hover:text-gold">
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
            <span className="text-gold">◆</span> {event.dateLabel} · {event.timeLabel}
          </span>
          <span className="bg-wood-dark/85 px-3 py-1.5 text-cream">
            <span className="text-gold">◷</span> Reservaciones: {event.opensAtLabel}
          </span>
        </div>
      </div>
    </section>
  );
}

function PreOpeningPanel({ event }: { event: ReservationEvent }) {
  return (
    <div className="parchment-panel pixel-frame-gold px-4 py-6 text-center sm:px-8">
      <p className="font-pixel text-sm uppercase tracking-[0.2em] text-primary">
        Las reservaciones abren en
      </p>
      <div className="mx-auto mt-4 max-w-md">
        <Countdown />
      </div>
      <p className="mt-5 font-display text-lg font-bold">{event.opensAtLabel}</p>
      <p className="font-pixel text-sm text-muted-foreground">Hora de Chihuahua</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Puedes ver las mesas desde ahora. Vuelve a esta página a la hora de apertura para apartar tu
        lugar.
      </p>
    </div>
  );
}

function EventNotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-3xl font-bold">Evento no encontrado</h1>
        <p className="mt-2 text-muted-foreground">Este evento no existe o ya no está disponible.</p>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary px-5 py-3 font-pixel text-primary-foreground shadow-pixel-sm"
        >
          Ver eventos ▸
        </Link>
      </main>
    </>
  );
}
