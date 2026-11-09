import { cn } from "@/lib/utils";
import { isReservable, seatsLeft } from "../table-state";
import type { GameTable, TableState } from "../types";
import { SeatPips } from "./SeatPips";
import { TableStatusChip } from "./TableStatusChip";

interface TableCardProps {
  table: GameTable;
  state: TableState;
  selected: boolean;
  flash: boolean;
  onSelect: (table: GameTable) => void;
}

export function TableCard({ table, state, selected, flash, onSelect }: TableCardProps) {
  const reservable = isReservable(state);
  const left = seatsLeft(table);
  const dimmed = state === "full" || state === "closed" || state === "locked";

  return (
    <button
      type="button"
      disabled={!reservable}
      onClick={() => onSelect(table)}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full w-full flex-col bg-card text-left pixel-frame transition-transform duration-200",
        reservable && "cursor-pointer hover:-translate-y-1",
        !reservable && "cursor-not-allowed",
        selected && "pixel-frame-gold -translate-y-1",
        flash && "animate-seat-flash",
      )}
    >
      <header
        className={cn(
          "flex items-start justify-between gap-2 px-4 py-3",
          state === "full" && "bg-wood-dark text-cream",
          state === "closed" && "bg-seat-closed text-seat-closed-foreground",
          state === "locked" && "bg-wood text-cream",
          reservable && "bg-band text-band-foreground",
        )}
      >
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{table.name}</h3>
          <p className="mt-0.5 font-pixel text-sm opacity-90">{table.game}</p>
        </div>
        {selected && (
          <span className="shrink-0 bg-gold px-1.5 py-0.5 font-pixel text-xs text-wood-dark">
            ✓ Elegida
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
          <span>{table.host}</span>
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
                <span className="text-muted-foreground"> / {table.capacity} lugares libres</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <TableStatusChip state={state} />
        {reservable && (
          <span className="font-pixel text-sm text-primary group-hover:underline">
            {selected ? "Seleccionada" : "Elegir ▸"}
          </span>
        )}
      </div>
    </button>
  );
}
