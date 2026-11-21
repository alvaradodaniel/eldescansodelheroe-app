import type { FirestoreEvent, FirestoreTable } from "./types";
import type { GameTable, ReservationEvent } from "../types";

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Chihuahua",
  }).format(date);
const timeLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chihuahua",
  }).format(date);

export function toReservationEvent(event: FirestoreEvent, now = Date.now()): ReservationEvent {
  const starts = event.startsAt.toDate();
  const opens = event.opensAt.toDate();
  return {
    id: event.id,
    name: event.name,
    tagline: event.tagline || "Evento de juegos",
    description: event.description || "",
    dateLabel: dateLabel(starts),
    timeLabel: timeLabel(starts),
    opensAtLabel: `${dateLabel(opens)} · ${timeLabel(opens)}`,
    status:
      event.status === "closed" || event.status === "cancelled"
        ? event.status
        : opens.getTime() <= now
          ? "open"
          : "published",
    band: event.band || "band-provision",
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
