import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it } from "vitest";

import { adminDb } from "./firebase-admin.js";
import { cancelReservationHandler, type CancelReservationData } from "./cancel-reservation.js";
import { reserveSeatHandler } from "./reserve-seat.js";

const eventId = "cancel-emulator-event";
const tableId = "cancel-emulator-table";

function request(data: Partial<CancelReservationData>, uid?: string) {
  return {
    data,
    auth: uid ? { uid, token: {} } : undefined,
  } as Parameters<typeof cancelReservationHandler>[0];
}

async function seedEvent() {
  await adminDb.doc(`events/${eventId}`).set({
    name: "Evento de cancelación",
    description: "Evento del emulador",
    startsAt: Timestamp.fromMillis(Date.now() + 3_600_000),
    opensAt: Timestamp.fromMillis(Date.now() - 1_000),
    timezone: "America/Chihuahua",
    status: "published",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await adminDb.doc(`events/${eventId}/tables/${tableId}`).set({
    name: "Mesa de cancelación",
    capacity: 2,
    reservedCount: 0,
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

async function reserve(uid: string) {
  return reserveSeatHandler({
    data: {
      eventId,
      tableId,
      nickname: "Heroe",
    },
    auth: { uid, token: {} },
  } as Parameters<typeof reserveSeatHandler>[0]);
}

beforeEach(async () => {
  await adminDb.recursiveDelete(adminDb.doc(`events/${eventId}`));
  await seedEvent();
});

describe("cancelReservation with Firebase Emulator Suite", () => {
  it("cancels a confirmed reservation and decrements the counter", async () => {
    await reserve("uid-cancel");

    await cancelReservationHandler(request({ eventId }, "uid-cancel"));
    expect(
      (await adminDb.doc(`events/${eventId}/reservations/uid-cancel`).get()).data(),
    ).toMatchObject({ status: "cancelled" });
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(0);
  });

  it("rejects unauthenticated requests", async () => {
    await expect(cancelReservationHandler(request({ eventId }))).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("rejects a missing reservation", async () => {
    await expect(
      cancelReservationHandler(request({ eventId }, "uid-missing")),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("does not allow cancelling another user's reservation", async () => {
    await reserve("uid-owner");

    await expect(cancelReservationHandler(request({ eventId }, "uid-other"))).rejects.toMatchObject(
      { code: "not-found" },
    );
  });

  it("rejects a reservation that is already cancelled", async () => {
    await reserve("uid-already-cancelled");
    await cancelReservationHandler(request({ eventId }, "uid-already-cancelled"));

    await expect(
      cancelReservationHandler(request({ eventId }, "uid-already-cancelled")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects cancellation after the event starts", async () => {
    await reserve("uid-late");
    await adminDb.doc(`events/${eventId}`).update({
      startsAt: Timestamp.fromMillis(Date.now() - 1_000),
    });

    await expect(cancelReservationHandler(request({ eventId }, "uid-late"))).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });

  it("allows only one of two simultaneous cancellations", async () => {
    await reserve("uid-race");

    const results = await Promise.allSettled([
      cancelReservationHandler(request({ eventId }, "uid-race")),
      cancelReservationHandler(request({ eventId }, "uid-race")),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(0);
  });

  it("never decrements the counter below zero", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: 0 });
    await adminDb.doc(`events/${eventId}/reservations/uid-inconsistent`).set({
      eventId,
      tableId,
      uid: "uid-inconsistent",
      nickname: "Heroe",
      status: "confirmed",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await expect(
      cancelReservationHandler(request({ eventId }, "uid-inconsistent")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(0);
  });
});
