import type { Timestamp } from "firebase/firestore";

export interface EventDocument {
  name: string;
  tagline: string;
  description: string;
  startsAt: Timestamp;
  opensAt: Timestamp;
  timezone: "America/Chihuahua";
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
