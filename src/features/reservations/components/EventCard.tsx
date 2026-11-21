import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { EventStatus, ReservationEvent } from "../types";

const STATUS: Record<EventStatus, { label: string; className: string }> = {
  open: { label: "● Reservaciones abiertas", className: "bg-seat-open text-seat-open-foreground" },
  published: { label: "◷ Abre pronto", className: "bg-gold text-wood-dark" },
  closed: { label: "Cerrado", className: "bg-seat-closed text-seat-closed-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
};

export function EventCard({ event }: { event: ReservationEvent }) {
  const status = STATUS[event.status];

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
        <p className="mt-auto font-pixel text-sm text-muted-foreground">
          Consulta las mesas y su disponibilidad
        </p>
        <span className="mt-1 self-start bg-primary px-4 py-1.5 font-pixel text-primary-foreground shadow-pixel-sm">
          Ver mesas ▸
        </span>
      </div>
    </Link>
  );
}
