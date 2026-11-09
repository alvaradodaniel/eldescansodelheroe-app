/**
 * Reservation domain types. The mockup uses them with fictional data so the
 * real app can keep the same shapes once it is backed by a database.
 */

export type EventStatus = "draft" | "published" | "open" | "closed" | "cancelled";

export interface GameTable {
  id: string;
  name: string;
  game: string;
  host: string;
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
  /** Pre-formatted labels in America/Chihuahua time. */
  dateLabel: string;
  timeLabel: string;
  opensAtLabel: string;
  timezone: "America/Chihuahua";
  status: EventStatus;
  /** Accent band utility borrowed from the public site's menu. */
  band: string;
  tables: GameTable[];
}

/** Visual state of a table card. */
export type TableState = "open" | "low" | "full" | "closed" | "locked";
