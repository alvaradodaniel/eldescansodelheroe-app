import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { useEventTables } from "@/features/reservations/firebase/use-event-tables";
import { usePublishedEvents } from "@/features/reservations/firebase/use-published-events";
import type { FirestoreEvent, FirestoreTable } from "@/features/reservations/firebase/types";

export const Route = createFileRoute("/diagnostico/firestore")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Diagnóstico Firestore · El Descanso del Héroe" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FirestoreDiagnosticsPage,
});

function FirestoreDiagnosticsPage() {
  const { events, loading: eventsLoading, error: eventsError } = usePublishedEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const tables = useEventTables(selectedEventId);

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-border pb-6">
          <p className="font-pixel text-sm uppercase tracking-[0.2em] text-primary">
            Solo desarrollo
          </p>
          <h1 className="mt-2 text-3xl font-bold">Diagnóstico de Firestore</h1>
          <p className="mt-2 text-muted-foreground">
            Lectura en tiempo real de eventos publicados y sus mesas.
          </p>
        </header>

        <section className="mt-8" aria-labelledby="events-heading">
          <h2 id="events-heading" className="text-2xl font-bold">
            Eventos publicados
          </h2>
          {eventsLoading && <LoadingMessage label="Cargando eventos..." />}
          {eventsError && <ErrorMessage error={eventsError} />}
          {!eventsLoading && !eventsError && events.length === 0 && (
            <EmptyMessage label="No hay eventos publicados en Firestore." />
          )}
          {!eventsLoading && !eventsError && events.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventOption
                  key={event.id}
                  event={event}
                  selected={event.id === selectedEventId}
                  onSelect={() => setSelectedEventId(event.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="tables-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="tables-heading" className="text-2xl font-bold">
              Mesas
            </h2>
            {selectedEvent && (
              <p className="text-sm text-muted-foreground">
                Evento: <strong>{selectedEvent.name}</strong>
              </p>
            )}
          </div>

          {!selectedEventId && <EmptyMessage label="Selecciona un evento para ver sus mesas." />}
          {selectedEventId && tables.loading && <LoadingMessage label="Cargando mesas..." />}
          {selectedEventId && tables.error && <ErrorMessage error={tables.error} />}
          {selectedEventId && !tables.loading && !tables.error && tables.tables.length === 0 && (
            <EmptyMessage label="Este evento no tiene mesas." />
          )}
          {selectedEventId && !tables.loading && !tables.error && tables.tables.length > 0 && (
            <div className="mt-4 overflow-x-auto border border-border">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="bg-muted font-pixel text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3">Juego</th>
                    <th className="px-4 py-3">Anfitrión</th>
                    <th className="px-4 py-3">Capacidad</th>
                    <th className="px-4 py-3">Reservados</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.tables.map((table) => (
                    <TableRow key={table.id} table={table} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EventOption({
  event,
  selected,
  onSelect,
}: {
  event: FirestoreEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`border px-4 py-3 text-left transition-colors ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
      }`}
    >
      <span className="block font-bold">{event.name}</span>
      <span className="mt-1 block text-sm text-muted-foreground">
        {event.id} · {event.status}
      </span>
      <span className="mt-2 block text-xs text-muted-foreground">
        Apertura: {formatTimestamp(event.opensAt)}
      </span>
    </button>
  );
}

function TableRow({ table }: { table: FirestoreTable }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <strong>{table.name}</strong>
        <span className="block text-xs text-muted-foreground">{table.id}</span>
      </td>
      <td className="px-4 py-3">{table.game ?? "—"}</td>
      <td className="px-4 py-3">{table.host ?? "—"}</td>
      <td className="px-4 py-3">{table.capacity}</td>
      <td className="px-4 py-3">{table.reservedCount}</td>
      <td className="px-4 py-3">{table.status}</td>
    </tr>
  );
}

function LoadingMessage({ label }: { label: string }) {
  return <p className="mt-4 text-muted-foreground">{label}</p>;
}

function EmptyMessage({ label }: { label: string }) {
  return (
    <p className="mt-4 border border-dashed border-border p-4 text-muted-foreground">{label}</p>
  );
}

function ErrorMessage({ error }: { error: Error }) {
  return (
    <p role="alert" className="mt-4 border border-destructive p-4 text-destructive">
      Error de Firestore: {error.message}
    </p>
  );
}

function formatTimestamp(timestamp: FirestoreEvent["opensAt"]) {
  return timestamp.toDate().toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chihuahua",
  });
}
