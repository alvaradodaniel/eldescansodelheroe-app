import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { eventSeatTotals } from "../table-state";
import type { EventStatus, ReservationEvent } from "../types";

const STATUS: Record<EventStatus, { label: string; className: string }> = {
  open: { label: "● Reservaciones abiertas", className: "bg-seat-open text-seat-open-foreground" },
  published: { label: "◷ Abre pronto", className: "bg-gold text-wood-dark" },
  closed: { label: "Cerrado", className: "bg-seat-closed text-seat-closed-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
  draft: { label: "Borrador", className: "bg-muted text-muted-foreground" },
};

export function EventCard({ event }: { event: ReservationEvent }) {
  const totals = eventSeatTotals(event.tables);
  const status = STATUS[event.status];
  const pct = totals.capacity ? Math.round((totals.taken / totals.capacity) * 100) : 0;

  return (
    <Link
      to="/eventos/$eventoId"
      params={{ eventoId: event.id }}
      className={cn(
        "group flex h-full flex-col bg-card pixel-frame transition-transform duration-200 hover:-translate-y-1.5",
        event.band,
        event.status === "closed" && "opacity-85",
      )}
    >
      <header className="bg-band px-4 py-3 text-band-foreground">
        <h3 className="font-display text-xl font-bold leading-tight">{event.name}</h3>
        <p className="font-pixel text-sm opacity-90">{event.tagline}</p>
      </header>
      <div className="flex flex-1 flex-col gap-3 border-t-4 border-wood-dark px-4 py-4">
        <span
          className={cn(
            "self-start px-2 py-0.5 font-pixel text-xs uppercase tracking-wide shadow-pixel-sm",
            status.className,
          )}
        >
          {status.label}
        </span>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Evento</dt>
            <dd className="text-right font-bold">
              {event.dateLabel} · {event.timeLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Apertura</dt>
            <dd className="text-right font-bold">{event.opensAtLabel}</dd>
          </div>
        </dl>
        <div className="mt-auto">
          <div className="flex justify-between font-pixel text-sm">
            <span>{event.tables.length} mesas</span>
            <span>
              {totals.left} de {totals.capacity} lugares libres
            </span>
          </div>
          <div className="mt-1.5 h-3 border-2 border-wood-dark bg-cream">
            <div className="h-full bg-band" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="mt-1 self-start bg-primary px-4 py-1.5 font-pixel text-primary-foreground shadow-pixel-sm">
          Ver mesas ▸
        </span>
      </div>
    </Link>
  );
}
