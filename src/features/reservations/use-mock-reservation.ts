import { useCallback, useEffect, useMemo, useState } from "react";

import { SIMULATED_LIVE_TABLE_ID, SIMULATED_RACE_TABLE_ID } from "./mock-data";
import { getTableState, isReservable, seatsLeft } from "./table-state";
import type { EventStatus, GameTable, ReservationEvent } from "./types";

export type ReservationPhase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "full"; tableName: string }
  | { kind: "confirmed"; table: GameTable; seatNumber: number; alias: string; serverTime: string };

const SIMULATED_SERVER_DELAY_MS = 1100;
const SIMULATED_LIVE_DELAY_MS = 9000;

/**
 * Mockup-only state machine that imitates the reservation flow in the browser.
 * The real app will replace `reserve` with a server call that assigns seats atomically.
 */
export function useMockReservation(event: ReservationEvent, status: EventStatus) {
  const [tables, setTables] = useState<GameTable[]>(event.tables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [phase, setPhase] = useState<ReservationPhase>({ kind: "idle" });
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    setTables(event.tables);
    setSelectedId(null);
    setPhase({ kind: "idle" });
  }, [event, status]);

  // Illustrates real-time updates: another player takes a seat after a few seconds.
  useEffect(() => {
    if (status !== "open") return;
    const id = window.setTimeout(() => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === SIMULATED_LIVE_TABLE_ID && seatsLeft(t) > 1 ? { ...t, taken: t.taken + 1 } : t,
        ),
      );
      setFlashId(SIMULATED_LIVE_TABLE_ID);
      window.setTimeout(() => setFlashId(null), 1700);
    }, SIMULATED_LIVE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [event, status]);

  const withState = useMemo(
    () => tables.map((table) => ({ table, state: getTableState(table, status) })),
    [tables, status],
  );

  const selected = tables.find((t) => t.id === selectedId) ?? null;

  const alternatives = withState
    .filter(({ table, state }) => isReservable(state) && table.id !== selectedId)
    .map(({ table }) => table)
    .slice(0, 3);

  const select = useCallback((table: GameTable) => {
    setSelectedId(table.id);
    setPhase({ kind: "idle" });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setPhase({ kind: "idle" });
  }, []);

  const reserve = useCallback(() => {
    if (!selected || alias.trim().length < 2) return;
    setPhase({ kind: "submitting" });
    window.setTimeout(() => {
      if (selected.id === SIMULATED_RACE_TABLE_ID) {
        setTables((prev) =>
          prev.map((t) => (t.id === selected.id ? { ...t, taken: t.capacity } : t)),
        );
        setPhase({ kind: "full", tableName: selected.name });
        return;
      }
      const seatNumber = selected.taken + 1;
      setTables((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, taken: t.taken + 1 } : t)),
      );
      setPhase({
        kind: "confirmed",
        table: { ...selected, taken: seatNumber },
        seatNumber,
        alias: alias.trim(),
        serverTime: "12:00:04 p.m.",
      });
    }, SIMULATED_SERVER_DELAY_MS);
  }, [selected, alias]);

  const reset = useCallback(() => {
    setSelectedId(null);
    setPhase({ kind: "idle" });
  }, []);

  return {
    tables: withState,
    selected,
    alias,
    setAlias,
    phase,
    flashId,
    alternatives,
    select,
    clearSelection,
    reserve,
    reset,
  };
}
