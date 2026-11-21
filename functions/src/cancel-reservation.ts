import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/https";

import { adminDb } from "./firebase-admin.js";
import { isDocumentId } from "./validation.js";

export interface CancelReservationData {
  eventId: string;
}

interface EventData {
  startsAt?: Timestamp;
}

interface TableData {
  reservedCount?: number;
}

interface ReservationData {
  tableId?: string;
  status?: string;
}

function validateData(data: unknown): CancelReservationData {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Cancellation data is required.");
  }

  const input = data as Partial<CancelReservationData>;

  if (!isDocumentId(input.eventId)) {
    throw new HttpsError("invalid-argument", "eventId is required.");
  }

  return {
    eventId: input.eventId.trim(),
  };
}

export async function cancelReservationHandler(
  request: CallableRequest<CancelReservationData>,
): Promise<void> {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const input = validateData(request.data);
  const eventRef = adminDb.doc(`events/${input.eventId}`);
  const reservationRef = eventRef.collection("reservations").doc(uid);
  return adminDb.runTransaction(async (transaction) => {
    const [eventSnapshot, reservationSnapshot] = await transaction.getAll(eventRef, reservationRef);

    if (!eventSnapshot.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }

    const event = eventSnapshot.data() as EventData;

    if (!(event.startsAt instanceof Timestamp)) {
      throw new HttpsError("failed-precondition", "Event start time is invalid.");
    }

    if (event.startsAt.toMillis() <= Date.now()) {
      throw new HttpsError(
        "failed-precondition",
        "Reservations cannot be cancelled after the event starts.",
      );
    }

    if (!reservationSnapshot.exists) {
      throw new HttpsError("not-found", "Active reservation not found.");
    }

    const reservation = reservationSnapshot.data() as ReservationData;

    if (reservation.status !== "confirmed" || !isDocumentId(reservation.tableId)) {
      throw new HttpsError("failed-precondition", "Reservation is already cancelled.");
    }

    const tableRef = eventRef.collection("tables").doc(reservation.tableId);
    const tableSnapshot = await transaction.get(tableRef);

    if (!tableSnapshot.exists) {
      throw new HttpsError("not-found", "Reserved table not found.");
    }

    const table = tableSnapshot.data() as TableData;

    if (
      typeof table.reservedCount !== "number" ||
      !Number.isInteger(table.reservedCount) ||
      table.reservedCount <= 0
    ) {
      throw new HttpsError("failed-precondition", "Table reservation count is inconsistent.");
    }

    const serverTimestamp = FieldValue.serverTimestamp();

    transaction.set(
      tableRef,
      {
        reservedCount: table.reservedCount - 1,
        updatedAt: serverTimestamp,
      },
      { merge: true },
    );
    transaction.set(
      reservationRef,
      {
        status: "cancelled",
        updatedAt: serverTimestamp,
        cancelledAt: serverTimestamp,
      },
      { merge: true },
    );
  });
}
