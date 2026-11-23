import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it } from "vitest";

import { adminDb } from "./firebase-admin.js";
import { reserveSeatHandler, type ReserveSeatData } from "./reserve-seat.js";

const eventId = "emulator-event";
const tableId = "emulator-table";

function request(data: Partial<ReserveSeatData>, uid?: string) {
  return {
    data,
    auth: uid ? { uid, token: {} } : undefined,
  } as Parameters<typeof reserveSeatHandler>[0];
}

async function seedEvent(options?: {
  opensAt?: Timestamp;
  table?: Partial<Record<string, unknown>>;
}) {
  await adminDb.doc(`events/${eventId}`).set({
    name: "Evento de prueba",
    description: "Evento del emulador",
    startsAt: Timestamp.fromMillis(Date.now() + 3_600_000),
    opensAt: options?.opensAt ?? Timestamp.fromMillis(Date.now() - 1_000),
    timezone: "America/Chihuahua",
    status: "published",
    band: "band-provision",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await adminDb.doc(`events/${eventId}/tables/${tableId}`).set({
    name: "Mesa de prueba",
    capacity: 2,
    reservedCount: 0,
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...options?.table,
  });
}

beforeEach(async () => {
  await adminDb.recursiveDelete(adminDb.doc(`events/${eventId}`));
  await seedEvent();
});

describe("reserveSeat with Firebase Emulator Suite", () => {
  it("creates a reservation successfully", async () => {
    await reserveSeatHandler(request({ eventId, tableId, nickname: "Aldric" }, "uid-success"));
    expect(
      (await adminDb.doc(`events/${eventId}/reservations/uid-success`).get()).data(),
    ).toMatchObject({ status: "confirmed", nickname: "Aldric" });
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(1);
  });

  it("rejects a full table", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({
      reservedCount: 2,
    });

    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Borin" }, "uid-full")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects inconsistent table capacity data", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: -1 });

    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Borin" }, "uid-invalid-count")),
    ).rejects.toMatchObject({
      code: "failed-precondition",
      message: "Table capacity data is inconsistent.",
    });
  });

  it("rejects an event that has not opened", async () => {
    await seedEvent({ opensAt: Timestamp.fromMillis(Date.now() + 60_000) });

    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Cora" }, "uid-closed")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects events that are not published", async () => {
    await adminDb.doc(`events/${eventId}`).update({ status: "closed" });

    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Cora" }, "uid-event-closed")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects a closed table", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({
      status: "closed",
    });

    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Daro" }, "uid-table-closed")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects unauthenticated requests", async () => {
    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: "Eira" })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("uses the authenticated UID instead of a UID supplied in the payload", async () => {
    const data = {
      eventId,
      tableId,
      nickname: "Galen",
      uid: "uid-from-payload",
    } as Partial<ReserveSeatData>;

    await reserveSeatHandler(request(data, "uid-from-auth"));

    expect((await adminDb.doc(`events/${eventId}/reservations/uid-from-auth`).get()).exists).toBe(
      true,
    );
    expect(
      (await adminDb.doc(`events/${eventId}/reservations/uid-from-payload`).get()).exists,
    ).toBe(false);
  });

  it("rejects invalid IDs and nicknames", async () => {
    await expect(
      reserveSeatHandler(
        request({ eventId: "invalid/id", tableId, nickname: "Galen" }, "uid-invalid"),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    await expect(
      reserveSeatHandler(request({ eventId, tableId, nickname: " " }, "uid-invalid")),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a repeated reservation without incrementing the count twice", async () => {
    const data = { eventId, tableId, nickname: "Fenn" };
    await reserveSeatHandler(request(data, "uid-duplicate"));

    await expect(reserveSeatHandler(request(data, "uid-duplicate"))).rejects.toMatchObject({
      code: "already-exists",
    });
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(1);
  });

  it("allows only one of two users to reserve the last place", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({
      capacity: 1,
    });

    const results = await Promise.allSettled([
      reserveSeatHandler(request({ eventId, tableId, nickname: "Hera" }, "uid-race-a")),
      reserveSeatHandler(request({ eventId, tableId, nickname: "Ivar" }, "uid-race-b")),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(1);
  });

  it("reactivates a previously cancelled reservation", async () => {
    await adminDb.doc(`events/${eventId}/reservations/uid-cancelled`).set({
      eventId,
      tableId,
      uid: "uid-cancelled",
      nickname: "Jora",
      status: "cancelled",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      cancelledAt: Timestamp.now(),
      cancellationReason: "test",
    });

    await reserveSeatHandler(request({ eventId, tableId, nickname: "Jora" }, "uid-cancelled"));
    const reservation = (
      await adminDb.doc(`events/${eventId}/reservations/uid-cancelled`).get()
    ).data();
    expect(reservation).toMatchObject({ status: "confirmed", nickname: "Jora" });
    expect(reservation?.cancelledAt).toBeUndefined();
  });
});
