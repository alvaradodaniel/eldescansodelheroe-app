import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seatsLeft } from "../table-state";
import type { GameTable } from "../types";
import type { ReservationPhase } from "../use-mock-reservation";

interface ReservationPanelProps {
  table: GameTable;
  alias: string;
  phase: ReservationPhase;
  alternatives: GameTable[];
  onAliasChange: (value: string) => void;
  onReserve: () => void;
  onClose: () => void;
  onPickAlternative: (table: GameTable) => void;
}

export function ReservationPanel({
  table,
  alias,
  phase,
  alternatives,
  onAliasChange,
  onReserve,
  onClose,
  onPickAlternative,
}: ReservationPanelProps) {
  const submitting = phase.kind === "submitting";
  const isFull = phase.kind === "full";
  const canSubmit = alias.trim().length >= 2 && !submitting && !isFull;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6">
      <section
        aria-label="Reservar lugar"
        className={cn(
          "mx-auto max-w-lg parchment-panel pixel-frame-gold animate-pop-in",
          isFull && "animate-shake",
        )}
      >
        <header className="flex items-start justify-between gap-3 wood-panel px-4 py-3">
          <div className="min-w-0">
            <p className="font-pixel text-xs uppercase tracking-widest text-gold">
              {isFull ? "Mesa llena" : "Reservar lugar en"}
            </p>
            <h2 className="truncate font-display text-xl font-bold text-cream">{table.name}</h2>
            {!isFull && (
              <p className="font-pixel text-sm text-cream/80">
                {table.game} · {seatsLeft(table)} de {table.capacity} libres
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-cream/80 hover:text-gold"
            aria-label="Cambiar de mesa"
          >
            <X className="size-5" />
          </button>
        </header>

        {isFull ? (
          <div className="px-4 py-4">
            <p className="text-foreground">
              <strong>¡Otro héroe tomó el último lugar!</strong> La mesa se llenó mientras
              reservabas. No se apartó ningún lugar a tu nombre.
            </p>
            {alternatives.length > 0 ? (
              <>
                <p className="mt-4 font-pixel text-sm uppercase tracking-widest text-primary">
                  Elige otra mesa
                </p>
                <ul className="mt-2 space-y-2">
                  {alternatives.map((alt) => (
                    <li key={alt.id}>
                      <button
                        type="button"
                        onClick={() => onPickAlternative(alt)}
                        className="flex w-full items-center justify-between gap-3 border-2 border-wood-dark bg-cream px-3 py-2 text-left shadow-pixel-sm transition-transform hover:-translate-y-0.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-display font-bold">{alt.name}</span>
                          <span className="block text-sm text-muted-foreground">{alt.game}</span>
                        </span>
                        <span className="shrink-0 bg-seat-open px-2 py-0.5 font-pixel text-xs text-seat-open-foreground">
                          {seatsLeft(alt)} libres
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-muted-foreground">Ya no quedan mesas con lugares libres.</p>
            )}
          </div>
        ) : (
          <form
            className="px-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              onReserve();
            }}
          >
            <label
              htmlFor="player-alias"
              className="font-pixel text-sm uppercase tracking-widest text-primary"
            >
              Nombre o alias del jugador
            </label>
            <input
              id="player-alias"
              value={alias}
              onChange={(e) => onAliasChange(e.target.value)}
              placeholder="Ej. Sir Galahad"
              maxLength={30}
              autoComplete="nickname"
              disabled={submitting}
              className="mt-2 h-12 w-full pixel-input px-3 text-lg outline-none focus:border-gold-deep"
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              Así aparecerás en la lista de la mesa.
            </p>
            <Button
              type="submit"
              variant="pixel"
              size="pixel"
              disabled={!canSubmit}
              className="mt-4 w-full"
            >
              {submitting ? (
                <>
                  <img
                    src="/images/brand/coin.webp"
                    alt=""
                    className="pixelated size-6 animate-coin"
                  />
                  Asignando lugar…
                </>
              ) : (
                "Reservar lugar ▸"
              )}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
