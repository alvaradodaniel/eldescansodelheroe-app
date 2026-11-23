import type { Timestamp } from "firebase/firestore";

export interface EventDocument {
  name: string;
  description: string;
  startsAt: Timestamp;
  opensAt: Timestamp;
  timezone: string;
  status: "draft" | "published" | "closed" | "cancelled";
  band: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TableDocument {
  name: string;
  description?: string;
  game?: string;
  host?: string;
  level?: string;
  capacity: number;
  reservedCount: number;
  status: "active" | "closed";
  closedReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FirestoreEvent = EventDocument & { id: string };
export type FirestoreTable = TableDocument & { id: string };
