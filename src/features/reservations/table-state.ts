import type { EventStatus, GameTable, TableState } from "./types";

/** A table shows "últimos lugares" when this many seats or fewer remain. */
export const LOW_SEATS_THRESHOLD = 2;

export function seatsLeft(table: GameTable): number {
  return Math.max(0, table.capacity - table.taken);
}

export function getTableState(table: GameTable, eventStatus: EventStatus): TableState {
  if (eventStatus === "closed" || eventStatus === "cancelled" || table.closed) return "closed";
  if (seatsLeft(table) === 0) return "full";
  if (eventStatus !== "open") return "locked";
  if (seatsLeft(table) <= LOW_SEATS_THRESHOLD) return "low";
  return "open";
}

export function isReservable(state: TableState): boolean {
  return state === "open" || state === "low";
}

export function eventSeatTotals(tables: GameTable[]) {
  const active = tables.filter((t) => !t.closed);
  const capacity = active.reduce((sum, t) => sum + t.capacity, 0);
  const taken = active.reduce((sum, t) => sum + Math.min(t.taken, t.capacity), 0);
  return { capacity, taken, left: capacity - taken };
}
