export type EventStatus = "published" | "open" | "closed" | "cancelled";

export interface GameTable {
  id: string;
  name: string;
  game: string;
  host: string;
  description?: string;
  /** Total seats; each table defines its own capacity. */
  capacity: number;
  /** Seats already assigned. */
  taken: number;
  /** Table closed by staff (e.g. host unavailable). */
  closed?: boolean;
  closedReason?: string;
  level?: string;
}

export interface ReservationEvent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  dateLabel: string;
  timeLabel: string;
  opensAtLabel: string;
  status: EventStatus;
  band: string;
}

/** Visual state of a table card. */
export type TableState = "open" | "low" | "full" | "closed" | "locked";
