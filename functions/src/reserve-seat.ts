import { HttpsError, type CallableRequest } from "firebase-functions/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin.js";
import { isDocumentId, isNonEmptyString } from "./validation.js";

export interface ReserveSeatData {
  eventId: string;
  tableId: string;
  nickname: string;
}

interface EventData {
  status?: string;
  opensAt?: Timestamp;
  startsAt?: Timestamp;
}

interface TableData {
  capacity?: number;
  reservedCount?: number;
  status?: string;
}

interface ReservationData {
  status?: string;
}

function validateData(data: unknown): ReserveSeatData {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Reservation data is required.");
  }

  const input = data as Partial<ReserveSeatData>;

  if (!isDocumentId(input.eventId) || !isDocumentId(input.tableId)) {
    throw new HttpsError("invalid-argument", "eventId and tableId are required.");
  }

  if (
    !isNonEmptyString(input.nickname) ||
    input.nickname.trim().length < 2 ||
    input.nickname.trim().length > 30
  ) {
    throw new HttpsError("invalid-argument", "nickname must contain between 2 and 30 characters.");
  }

  return {
    eventId: input.eventId.trim(),
    tableId: input.tableId.trim(),
    nickname: input.nickname.trim(),
  };
}

export async function reserveSeatHandler(request: CallableRequest<ReserveSeatData>): Promise<void> {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const input = validateData(request.data);
  const eventRef = adminDb.doc(`events/${input.eventId}`);
  const tableRef = eventRef.collection("tables").doc(input.tableId);
  const reservationRef = eventRef.collection("reservations").doc(uid);
  return adminDb.runTransaction(async (transaction) => {
    const [eventSnapshot, tableSnapshot, reservationSnapshot] = await transaction.getAll(
      eventRef,
      tableRef,
      reservationRef,
    );

    if (!eventSnapshot.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }

    const event = eventSnapshot.data() as EventData;

    if (event.status !== "published") {
      throw new HttpsError("failed-precondition", "Event is not open for reservations.");
    }

    if (!(event.opensAt instanceof Timestamp) || event.opensAt.toMillis() > Date.now()) {
      throw new HttpsError("failed-precondition", "Reservations are not open yet.");
    }
    if (!(event.startsAt instanceof Timestamp) || event.startsAt.toMillis() <= Date.now()) {
      throw new HttpsError("failed-precondition", "Event has already started.");
    }

    if (!tableSnapshot.exists) {
      throw new HttpsError("not-found", "Table not found.");
    }

    const table = tableSnapshot.data() as TableData;
    const capacity = table.capacity;
    const reservedCount = table.reservedCount;

    if (table.status !== "active") {
      throw new HttpsError("failed-precondition", "Table is closed.");
    }

    if (
      typeof capacity !== "number" ||
      typeof reservedCount !== "number" ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isInteger(reservedCount) ||
      reservedCount < 0
    ) {
      throw new HttpsError("failed-precondition", "Table capacity data is inconsistent.");
    }

    if (reservedCount >= capacity) {
      throw new HttpsError("failed-precondition", "Table is full.");
    }

    if (reservationSnapshot.exists) {
      const reservation = reservationSnapshot.data() as ReservationData;

      if (reservation.status === "confirmed") {
        throw new HttpsError(
          "already-exists",
          "This user already has an active reservation for the event.",
        );
      }
    }

    const serverTimestamp = FieldValue.serverTimestamp();

    transaction.set(
      tableRef,
      {
        reservedCount: reservedCount + 1,
        updatedAt: serverTimestamp,
      },
      { merge: true },
    );
    transaction.set(
      reservationRef,
      {
        eventId: input.eventId,
        tableId: input.tableId,
        uid,
        nickname: input.nickname,
        status: "confirmed",
        createdAt: serverTimestamp,
        updatedAt: serverTimestamp,
        cancelledAt: FieldValue.delete(),
      },
      { merge: true },
    );
  });
}
