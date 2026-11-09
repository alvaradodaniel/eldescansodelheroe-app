import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { GameTable, ReservationEvent } from "../types";
import { SeatPips } from "./SeatPips";

interface ConfirmationViewProps {
  event: ReservationEvent;
  table: GameTable;
  seatNumber: number;
  alias: string;
  serverTime: string;
  onBack: () => void;
}

export function ConfirmationView({
  event,
  table,
  seatNumber,
  alias,
  serverTime,
  onBack,
}: ConfirmationViewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <section className="mx-auto max-w-lg animate-pop-in px-5 pt-10 sm:px-6">
      <div className="relative parchment-panel pixel-frame-gold px-6 pb-8 pt-16 text-center">
        <img
          src="/images/brand/icon-especiales.png"
          alt=""
          width={294}
          height={280}
          className="pixelated absolute -top-12 left-1/2 w-28 -translate-x-1/2 animate-float"
        />
        <p className="font-pixel text-sm uppercase tracking-[0.2em] text-primary">
          Reservación confirmada
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">¡Lugar asegurado, {alias}!</h1>
        <div className="mx-auto mt-4 w-40 ornament-rule" />

        <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="col-span-2 bg-card p-3 pixel-frame">
            <dt className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
              Mesa
            </dt>
            <dd className="font-display text-xl font-bold">{table.name}</dd>
            <dd className="text-sm text-muted-foreground">
              {table.game} · {table.host}
            </dd>
            <SeatPips
              capacity={table.capacity}
              taken={table.taken}
              highlight={seatNumber - 1}
              className="mt-3"
            />
          </div>
          <div className="bg-card p-3 pixel-frame">
            <dt className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
              Tu lugar
            </dt>
            <dd className="font-display text-2xl font-bold">
              #{seatNumber}{" "}
              <span className="text-base text-muted-foreground">de {table.capacity}</span>
            </dd>
          </div>
          <div className="bg-card p-3 pixel-frame">
            <dt className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
              Evento
            </dt>
            <dd className="font-display font-bold leading-tight">{event.name}</dd>
            <dd className="text-sm text-muted-foreground">
              {event.dateLabel} · {event.timeLabel}
            </dd>
          </div>
        </dl>

        <p className="mt-6 inline-flex items-center gap-2 bg-wood-dark px-3 py-1.5 font-pixel text-sm text-cream">
          <span className="text-gold" aria-hidden>
            ✓
          </span>
          Registrado a las {serverTime} · hora de Chihuahua
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Toma captura de esta pantalla. Si no puedes asistir, avísanos por WhatsApp para liberar tu
          lugar.
        </p>

        <Button variant="pixel-dark" size="pixel" onClick={onBack} className="mt-6">
          ◂ Volver a las mesas
        </Button>
      </div>
    </section>
  );
}
