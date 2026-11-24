import { cn } from "@/lib/utils";
import { LoaderCircle, UserRound } from "lucide-react";
import { isReservable, seatsLeft } from "../table-state";
import type { GameTable, TableState } from "../types";
import { SeatPips } from "./SeatPips";
import { TableStatusChip } from "./TableStatusChip";

export function TableCardSkeleton() {
  return (
    <div className="flex h-full min-h-56 flex-col bg-card pixel-frame" aria-hidden="true">
      <div className="flex items-start justify-between gap-2 bg-band px-4 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-2/3 animate-pulse bg-band-foreground/20" />
          <div className="h-3 w-1/2 animate-pulse bg-band-foreground/15" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t-4 border-wood-dark px-4 py-4">
        <div className="space-y-2">
          <div className="h-3 w-2/3 animate-pulse bg-wood-dark/10" />
          <div className="h-3 w-full animate-pulse bg-wood-dark/10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((seat) => (
            <div
              key={seat}
              className="size-7 animate-pulse border-2 border-wood-dark/15 bg-parchment"
            />
          ))}
        </div>
        <div className="mt-auto h-6 w-32 animate-pulse bg-wood-dark/10" />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <div className="h-7 w-24 animate-pulse border-2 border-wood-dark/10 bg-parchment" />
        <div className="h-3 w-20 animate-pulse bg-wood-dark/10" />
      </div>
    </div>
  );
}

interface TableCardProps {
  table: GameTable;
  state: TableState;
  selected: boolean;
  bandClass?: string;
  reservationTableId?: string;
  pending?: boolean;
  disabled?: boolean;
  onSelect: (table: GameTable) => void;
}

export function TableCard({
  table,
  state,
  selected,
  bandClass = "band-provision",
  reservationTableId,
  pending = false,
  disabled = false,
  onSelect,
}: TableCardProps) {
  const reservable = isReservable(state);
  const canSelect = reservable && !disabled;
  const left = seatsLeft(table);
  const dimmed = state === "full" || state === "closed" || state === "locked";
  const reservedForAnotherTable = Boolean(reservationTableId && reservationTableId !== table.id);
  const hasReservation = Boolean(reservationTableId);

  return (
    <button
      type="button"
      disabled={!canSelect && !hasReservation}
      onClick={() => onSelect(table)}
      aria-pressed={selected}
      aria-disabled={!canSelect}
      className={cn(
        "group relative flex h-full w-full flex-col bg-card text-left pixel-frame transition-transform duration-200",
        canSelect && "cursor-pointer hover:-translate-y-1",
        !canSelect && "cursor-not-allowed",
        selected && "pixel-frame-gold -translate-y-1",
        reservedForAnotherTable && "grayscale opacity-60",
      )}
    >
      <header
        className={cn(
          "flex items-start justify-between gap-2 px-4 py-3",
          state === "full" && "bg-wood-dark text-cream",
          state === "closed" && "bg-seat-closed text-seat-closed-foreground",
          state === "locked" && "bg-wood text-cream",
          reservable && bandClass && "bg-band text-band-foreground",
          reservable && bandClass,
        )}
      >
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{table.name}</h3>
          <p className="mt-0.5 font-pixel text-sm opacity-90">{table.game}</p>
        </div>
        {selected && (
          <span className="inline-flex shrink-0 items-center gap-1 bg-gold px-1.5 py-0.5 font-pixel text-xs text-wood-dark">
            {pending ? (
              <>
                <LoaderCircle className="size-3 animate-spin" aria-hidden /> Reservando
              </>
            ) : (
              "Tu mesa"
            )}
          </span>
        )}
      </header>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 border-t-4 border-wood-dark px-4 py-4",
          dimmed && "locked",
        )}
      >
        <div className="text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <UserRound className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-pixel text-xs uppercase tracking-wide">Anfitrión:</span>
            <span className="font-semibold text-foreground">{table.host}</span>
          </div>
          {table.level && (
            <span className="ml-2 font-semibold text-foreground">· {table.level}</span>
          )}
          {table.description && <p className="mt-1">{table.description}</p>}
        </div>

        <SeatPips capacity={table.capacity} taken={Math.min(table.taken, table.capacity)} />

        <div className="flex items-end justify-between gap-2">
          <p className="leading-tight">
            {state === "closed" ? (
              <span className="font-pixel text-sm text-muted-foreground">
                {table.closedReason ?? "Mesa no disponible"}
              </span>
            ) : (
              <>
                <span className="font-display text-2xl font-bold">{left}</span>
                <span className="text-muted-foreground">
                  {" "}
                  / {table.capacity} {table.capacity === 1 ? "lugar" : "lugares"} libres
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <TableStatusChip state={state} />
        {hasReservation ? (
          <span className="font-pixel text-xs text-muted-foreground">
            {selected ? "Ya perteneces a esta mesa" : "Ya estás en otra mesa"}
          </span>
        ) : reservable ? (
          <span className="font-pixel text-sm text-primary group-hover:underline">
            {selected ? "Seleccionada" : "Elegir ▸"}
          </span>
        ) : null}
      </div>
    </button>
  );
}
