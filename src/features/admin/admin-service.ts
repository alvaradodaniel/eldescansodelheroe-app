import {
  onSnapshot,
  collection,
  doc,
  getDocs,
  getCountFromServer,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { firebaseFirestore, firebaseFunctions } from "@/lib/firebase";
import type { EventDocument, TableDocument } from "@/features/reservations/firebase/types";

export interface AdminEvent extends EventDocument {
  id: string;
}
export interface AdminTable extends TableDocument {
  id: string;
}
export interface AdminReservation {
  uid: string;
  eventId: string;
  tableId: string;
  nickname: string;
  status: "confirmed" | "cancelled";
  createdAt?: { toDate(): Date };
  cancelledAt?: { toDate(): Date };
}
export interface AdminDashboardStats {
  events: number;
  published: number;
  upcoming: number;
  reservations: number;
  occupied: number;
  available: number;
  recent: AdminEvent[];
}

export type Weekday =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export interface WeeklyTableTemplate {
  id: string;
  name: string;
  host: string;
  capacity: number;
  status: "active" | "closed";
  game: string;
  description: string;
  closedReason: string;
}
export interface WeeklyTableTemplates {
  days: Record<Weekday, WeeklyTableTemplate[]>;
}

const events = collection(firebaseFirestore, "events");
const saveEventCall = httpsCallable(firebaseFunctions, "adminSaveEvent");
const saveTableCall = httpsCallable(firebaseFunctions, "adminSaveTable");
const cancelReservationCall = httpsCallable(firebaseFunctions, "adminCancelReservation");
const getWeeklyTemplatesCall = httpsCallable(firebaseFunctions, "adminGetWeeklyTemplates");
const saveWeeklyTemplatesCall = httpsCallable(firebaseFunctions, "adminSaveWeeklyTemplates");

export function subscribeAdminEvents(
  next: (items: AdminEvent[]) => void,
  error: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(events, orderBy("updatedAt", "desc")),
    (snapshot) => {
      next(snapshot.docs.map((item) => ({ ...(item.data() as EventDocument), id: item.id })));
    },
    error,
  );
}

export function subscribeAdminEvent(
  eventId: string,
  next: (event: AdminEvent | null) => void,
  error: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(events, eventId),
    (snapshot) => {
      next(snapshot.exists() ? { ...(snapshot.data() as EventDocument), id: snapshot.id } : null);
    },
    error,
  );
}

export function subscribeAdminTables(
  eventId: string,
  next: (items: AdminTable[]) => void,
  error: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(events, eventId, "tables"), orderBy("name", "asc")),
    (snapshot) => {
      next(snapshot.docs.map((item) => ({ ...(item.data() as TableDocument), id: item.id })));
    },
    error,
  );
}

export function subscribeAdminReservations(
  eventId: string,
  next: (items: AdminReservation[]) => void,
  error: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(events, eventId, "reservations"), orderBy("createdAt", "desc")),
    (snapshot) => {
      next(
        snapshot.docs.map((item) => ({
          ...(item.data() as Omit<AdminReservation, "uid">),
          uid: item.id,
        })),
      );
    },
    error,
  );
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const eventSnapshot = await getDocs(query(events, orderBy("updatedAt", "desc")));
  const allEvents = eventSnapshot.docs.map((item) => ({
    ...(item.data() as EventDocument),
    id: item.id,
  }));
  let reservations = 0;
  let occupied = 0;
  let available = 0;
  await Promise.all(
    allEvents.map(async (event) => {
      const [tableSnapshot, reservationCount] = await Promise.all([
        getDocs(collection(events, event.id, "tables")),
        getCountFromServer(
          query(collection(events, event.id, "reservations"), where("status", "==", "confirmed")),
        ),
      ]);
      for (const tableDoc of tableSnapshot.docs) {
        const table = tableDoc.data() as TableDocument;
        occupied += table.reservedCount;
        available += Math.max(0, table.capacity - table.reservedCount);
      }
      reservations += reservationCount.data().count;
    }),
  );
  const now = Date.now();
  return {
    events: allEvents.length,
    published: allEvents.filter((event) => event.status === "published").length,
    upcoming: allEvents.filter(
      (event) => event.startsAt.toMillis() > now && event.status !== "cancelled",
    ).length,
    reservations,
    occupied,
    available,
    recent: allEvents.slice(0, 5),
  };
}

export async function adminSaveEvent(input: Record<string, unknown>): Promise<string> {
  const result = await saveEventCall(input);
  return (result.data as { eventId: string }).eventId;
}
export async function adminSaveTable(input: Record<string, unknown>): Promise<string> {
  const result = await saveTableCall(input);
  return (result.data as { tableId: string }).tableId;
}
export async function adminCancelReservation(input: {
  eventId: string;
  uid: string;
}): Promise<void> {
  await cancelReservationCall(input);
}

export async function getWeeklyTableTemplates(): Promise<WeeklyTableTemplates> {
  const result = await getWeeklyTemplatesCall();
  return result.data as WeeklyTableTemplates;
}

export async function saveWeeklyTableTemplates(templates: WeeklyTableTemplates): Promise<void> {
  await saveWeeklyTemplatesCall(templates);
}
