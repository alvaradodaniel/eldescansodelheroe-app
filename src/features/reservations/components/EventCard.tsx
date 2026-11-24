import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EventStatus, ReservationEvent } from "../types";

const STATUS: Record<EventStatus, { label: string; className: string }> = {
  open: { label: "● Reservaciones abiertas", className: "bg-seat-open text-seat-open-foreground" },
  published: { label: "◷ Abre pronto", className: "bg-gold text-wood-dark" },
  closed: { label: "Cerrado", className: "bg-seat-closed text-seat-closed-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
};

export function EventCardSkeleton() {
  return (
    <div className="flex h-full min-h-72 flex-col bg-card pixel-frame" aria-hidden="true">
      <div className="flex min-h-14 items-center border-b-4 border-wood-dark bg-parchment px-4 py-3">
        <div className="h-5 w-2/3 animate-pulse bg-wood-dark/15" />
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t-4 border-wood-dark px-4 py-4">
        <div className="h-6 w-36 animate-pulse bg-gold/40" />
        <div className="grid gap-3 text-sm">
          {[0, 1].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="size-9 shrink-0 animate-pulse border-2 border-wood-dark/10 bg-parchment" />
              <div className="min-w-0 flex-1 space-y-2 py-1">
                <div className="h-3 w-24 animate-pulse bg-wood-dark/10" />
                <div className="h-4 w-4/5 animate-pulse bg-wood-dark/15" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-wood-dark/20 pt-3">
          <div className="h-3 w-40 animate-pulse bg-wood-dark/10" />
          <div className="h-10 w-28 animate-pulse bg-primary/20 shadow-pixel-sm" />
        </div>
      </div>
    </div>
  );
}

export function EventCard({ event }: { event: ReservationEvent }) {
  const status = event.past
    ? { label: "Evento finalizado", className: "bg-muted text-muted-foreground" }
    : STATUS[event.status];

  return (
    <Link
      to="/eventos/$eventoId"
      params={{ eventoId: event.id }}
      className={cn(
        "group flex h-full min-h-72 flex-col bg-card pixel-frame transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold",
        event.band,
        event.status === "cancelled" && "[--frame:var(--color-red-900)]",
        (event.status === "closed" || event.past) && "grayscale opacity-85",
      )}
    >
      <header className="flex min-h-14 items-center bg-band px-4 py-3 text-band-foreground">
        <h3 className="font-display text-xl font-bold leading-tight">{event.name}</h3>
      </header>
      <div
        className={cn(
          "flex flex-1 flex-col gap-4 border-t-4 px-4 py-4",
          event.status === "cancelled" ? "border-red-900" : "border-wood-dark",
        )}
      >
        <span
          className={cn(
            "self-start border-2 px-2.5 py-1 font-pixel text-xs uppercase tracking-wide shadow-pixel-sm",
            event.status === "cancelled" ? "border-red-900/40" : "border-wood-dark/20",
            status.className,
          )}
        >
          {status.label}
        </span>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center border-2 border-wood-dark/20 bg-parchment text-primary">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="font-pixel text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Evento
              </dt>
              <dd className="mt-0.5 font-bold leading-snug">
                {event.dateLabel}
                <span className="text-muted-foreground"> · </span>
                {event.timeLabel}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center border-2 border-wood-dark/20 bg-parchment text-primary">
              <Clock3 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="font-pixel text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Apertura de reservaciones
              </dt>
              <dd className="mt-0.5 font-bold leading-snug">{event.opensAtLabel}</dd>
            </div>
          </div>
        </dl>
        <div
          className={cn(
            "mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed pt-3",
            event.status === "cancelled" ? "border-red-900/40" : "border-wood-dark/25",
          )}
        >
          {event.status === "cancelled" && (
            <p className="font-pixel text-xs leading-relaxed text-red-900">
              Este evento fue cancelado
            </p>
          )}
          <p
            className={cn(
              "font-pixel text-xs leading-relaxed text-muted-foreground",
              event.status === "cancelled" && "hidden",
            )}
          >
            {event.past ? "Este evento ya pasó" : "Consulta mesas y lugares disponibles"}
          </p>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-2 px-3 py-2 font-pixel text-sm shadow-pixel-sm transition-transform group-hover:translate-x-0.5",
              event.status === "cancelled"
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {event.status === "cancelled" ? "Ver aviso" : event.past ? "Ver evento" : "Ver mesas"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
