import type { FirestoreEvent, FirestoreTable } from "./types";
import type { GameTable, ReservationEvent } from "../types";
import { RESTAURANT_TIMEZONE } from "../timezone";
import { getEventBand } from "../visual-bands";
import { hasEventPassed } from "../event-lifecycle";

const dateLabel = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(date);
const timeLabel = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);

export function toReservationEvent(event: FirestoreEvent, now = Date.now()): ReservationEvent {
  const starts = event.startsAt.toDate();
  const opens = event.opensAt.toDate();
  const timezone = RESTAURANT_TIMEZONE;
  const past = hasEventPassed(starts, now) && event.status !== "cancelled";
  return {
    id: event.id,
    name: event.name,
    description: event.description || "",
    dateLabel: dateLabel(starts, timezone),
    timeLabel: timeLabel(starts, timezone),
    opensAtLabel: `${dateLabel(opens, timezone)} · ${timeLabel(opens, timezone)}`,
    status:
      event.status === "closed" || event.status === "cancelled"
        ? event.status
        : past
          ? "closed"
          : opens.getTime() <= now
            ? "open"
            : "published",
    past,
    band: getEventBand(starts),
  };
}

export function toGameTable(table: FirestoreTable): GameTable {
  return {
    id: table.id,
    name: table.name,
    game: table.game || "Juego de mesa",
    host: table.host || "Anfitrión por confirmar",
    ...(table.description ? { description: table.description } : {}),
    capacity: table.capacity,
    taken: table.reservedCount,
    closed: table.status !== "active",
    ...(table.closedReason ? { closedReason: table.closedReason } : {}),
    ...(table.level ? { level: table.level } : {}),
  };
}
