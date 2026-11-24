import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it } from "vitest";

import { adminDb } from "./firebase-admin.js";
import {
  adminCancelReservationHandler,
  adminDeleteEventHandler,
  adminDeleteTableHandler,
  adminGetWeeklyTemplatesHandler,
  adminSaveWeeklyTemplatesHandler,
  adminSaveEventHandler,
  adminSaveTableHandler,
  type AdminCancelReservationData,
  type AdminDeleteTableData,
  type AdminDeleteEventData,
  type AdminSaveEventData,
  type AdminSaveTableData,
  type WeeklyTableTemplates,
} from "./admin.js";

const eventId = "admin-emulator-event";
const tableId = "admin-emulator-table";

function request<T>(data: T, uid: string | null = "admin-user", admin = true) {
  return {
    data,
    auth: uid ? { uid, token: { admin } } : undefined,
  } as never;
}

async function seedEvent() {
  await adminDb.doc(`events/${eventId}`).set({
    name: "Evento administrativo",
    description: "",
    startsAt: Timestamp.fromMillis(Date.now() + 86_400_000),
    opensAt: Timestamp.fromMillis(Date.now() - 60_000),
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
  });
}

const eventInput: AdminSaveEventData = {
  name: "Evento nuevo",
  description: "",
  startsAt: new Date(Date.now() + 86_400_000).toISOString(),
  opensAt: new Date(Date.now() + 3_600_000).toISOString(),
  status: "draft",
};

beforeEach(async () => {
  await adminDb.recursiveDelete(adminDb.doc(`events/${eventId}`));
  await adminDb.doc("adminConfig/weeklyTableTemplates").delete();
  await seedEvent();
});

describe("administrative Cloud Functions", () => {
  it("protects reads of weekly templates with the admin claim", async () => {
    await expect(
      adminGetWeeklyTemplatesHandler(request(undefined, "regular-user", false)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(adminGetWeeklyTemplatesHandler(request(undefined, null))).rejects.toMatchObject({
      code: "unauthenticated",
    });

    const templates = await adminGetWeeklyTemplatesHandler(request(undefined));
    expect(templates.days.saturday).toHaveLength(1);
  });

  it("rejects event, table, and cancellation operations without the admin claim", async () => {
    await expect(
      adminSaveEventHandler(request<AdminSaveEventData>(eventInput, "regular-user", false)),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      adminSaveWeeklyTemplatesHandler(
        request<WeeklyTableTemplates>(
          { days: {} as WeeklyTableTemplates["days"] },
          "regular-user",
          false,
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      adminSaveTableHandler(
        request<AdminSaveTableData>(
          { eventId, tableId, name: "Mesa", host: "Master", capacity: 2, status: "active" },
          "regular-user",
          false,
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      adminDeleteTableHandler(
        request<AdminDeleteTableData>({ eventId, tableId }, "regular-user", false),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      adminDeleteEventHandler(request<AdminDeleteEventData>({ eventId }, "regular-user", false)),
    ).rejects.toMatchObject({ code: "permission-denied" });

    await expect(
      adminCancelReservationHandler(
        request<AdminCancelReservationData>(
          { eventId, uid: "reservation-owner" },
          "regular-user",
          false,
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects unauthenticated administrative operations", async () => {
    await expect(
      adminSaveEventHandler(request<AdminSaveEventData>(eventInput, null)),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      adminSaveTableHandler(
        request<AdminSaveTableData>(
          { eventId, name: "Mesa", host: "Master", capacity: 2, status: "active" },
          null,
        ),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      adminDeleteTableHandler(request<AdminDeleteTableData>({ eventId, tableId }, null)),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      adminDeleteEventHandler(request<AdminDeleteEventData>({ eventId }, null)),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      adminCancelReservationHandler(
        request<AdminCancelReservationData>({ eventId, uid: "reservation-owner" }, null),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      adminSaveWeeklyTemplatesHandler(
        request<WeeklyTableTemplates>({ days: {} as WeeklyTableTemplates["days"] }, null),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("deletes an event and its nested tables and reservations for admins", async () => {
    await adminDb.doc(`events/${eventId}/reservations/example-user`).set({
      uid: "example-user",
      tableId,
      status: "confirmed",
    });
    await adminDeleteEventHandler(request<AdminDeleteEventData>({ eventId }));
    expect((await adminDb.doc(`events/${eventId}`).get()).exists).toBe(false);
    expect((await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).exists).toBe(false);
    expect((await adminDb.doc(`events/${eventId}/reservations/example-user`).get()).exists).toBe(
      false,
    );
  });

  it("accepts an administrator claim when saving an event", async () => {
    const result = await adminSaveEventHandler(
      request<AdminSaveEventData>({ ...eventInput, eventId }),
    );
    const saved = await adminDb.doc(`events/${result.eventId}`).get();
    expect(saved.data()).toMatchObject({ name: "Evento nuevo", status: "draft" });
    expect(saved.data()).not.toHaveProperty("band");
  });

  it("rejects impossible calendar dates", async () => {
    await expect(
      adminSaveEventHandler(
        request<AdminSaveEventData>({
          ...eventInput,
          eventId,
          startsAt: "2026-02-30T12:00:00.000Z",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("copies the selected weekday template into a new event and keeps it unchanged afterward", async () => {
    const days: WeeklyTableTemplates["days"] = {
      monday: [],
      tuesday: [
        {
          id: "tuesday-one",
          name: "Mesa Norte",
          host: "Edd",
          capacity: 4,
          status: "active",
          game: "",
          description: "",
          closedReason: "",
        },
        {
          id: "tuesday-two",
          name: "Mesa Sur",
          host: "Emilio",
          capacity: 6,
          status: "active",
          game: "",
          description: "",
          closedReason: "",
        },
      ],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    await adminSaveWeeklyTemplatesHandler(request<WeeklyTableTemplates>({ days }));
    const result = await adminSaveEventHandler(
      request<AdminSaveEventData>({
        ...eventInput,
        startsAt: "2027-01-06T00:00:00.000Z",
        opensAt: "2027-01-05T00:00:00.000Z",
      }),
    );

    const eventTables = await adminDb.collection(`events/${result.eventId}/tables`).get();
    expect(eventTables.docs.map((snapshot) => snapshot.data())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Mesa Norte", host: "Edd", reservedCount: 0 }),
        expect.objectContaining({ name: "Mesa Sur", host: "Emilio", reservedCount: 0 }),
      ]),
    );

    days.tuesday = [
      {
        id: "tuesday-new",
        name: "Mesa nueva",
        host: "Cambio",
        capacity: 3,
        status: "active",
        game: "",
        description: "",
        closedReason: "",
      },
    ];
    await adminSaveWeeklyTemplatesHandler(request<WeeklyTableTemplates>({ days }));
    expect((await adminDb.collection(`events/${result.eventId}/tables`).get()).size).toBe(2);
    await adminDb.recursiveDelete(adminDb.doc(`events/${result.eventId}`));
  });

  it("rejects reducing table capacity below confirmed reservations without changing the counter", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({
      capacity: 2,
      reservedCount: 2,
    });
    const input: AdminSaveTableData = {
      eventId,
      tableId,
      name: "Mesa editada",
      host: "Master editado",
      capacity: 1,
      status: "active",
    };

    await expect(adminSaveTableHandler(request(input))).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect((await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()).toMatchObject({
      capacity: 2,
      reservedCount: 2,
    });
  });

  it("preserves occupied seats when editing a table", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: 1 });
    const input: AdminSaveTableData = {
      eventId,
      tableId,
      name: "Mesa editada",
      host: "Master editado",
      capacity: 3,
      status: "active",
    };

    await adminSaveTableHandler(request(input));
    expect((await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()).toMatchObject({
      name: "Mesa editada",
      capacity: 3,
      reservedCount: 1,
    });
  });

  it("deletes a table with no confirmed reservations", async () => {
    await expect(
      adminDeleteTableHandler(request<AdminDeleteTableData>({ eventId, tableId })),
    ).resolves.toEqual({ deleted: true });
    expect((await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).exists).toBe(false);
  });

  it("protects confirmed reservations from table deletion", async () => {
    const uid = "table-delete-reservation";
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: 1 });
    await adminDb.doc(`events/${eventId}/reservations/${uid}`).set({
      eventId,
      tableId,
      uid,
      nickname: "Heroe",
      status: "confirmed",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await expect(
      adminDeleteTableHandler(request<AdminDeleteTableData>({ eventId, tableId })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect((await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()).toMatchObject({
      reservedCount: 1,
    });
    expect((await adminDb.doc(`events/${eventId}/reservations/${uid}`).get()).data()?.status).toBe(
      "confirmed",
    );
  });

  it("allows only one simultaneous cancellation of the same reservation", async () => {
    const uid = "same-cancel-user";
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: 1 });
    await adminDb.doc(`events/${eventId}/reservations/${uid}`).set({
      eventId,
      tableId,
      uid,
      nickname: "Heroe",
      status: "confirmed",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const input: AdminCancelReservationData = { eventId, uid };

    const results = await Promise.allSettled([
      adminCancelReservationHandler(request(input)),
      adminCancelReservationHandler(request(input)),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(0);
    expect((await adminDb.doc(`events/${eventId}/reservations/${uid}`).get()).data()?.status).toBe(
      "cancelled",
    );
  });

  it("cancels two different reservations concurrently without losing counter updates", async () => {
    await adminDb.doc(`events/${eventId}/tables/${tableId}`).update({ reservedCount: 2 });
    for (const uid of ["cancel-user-a", "cancel-user-b"]) {
      await adminDb.doc(`events/${eventId}/reservations/${uid}`).set({
        eventId,
        tableId,
        uid,
        nickname: uid,
        status: "confirmed",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    const results = await Promise.allSettled(
      ["cancel-user-a", "cancel-user-b"].map((uid) =>
        adminCancelReservationHandler(request<AdminCancelReservationData>({ eventId, uid })),
      ),
    );
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect(
      (await adminDb.doc(`events/${eventId}/tables/${tableId}`).get()).data()?.reservedCount,
    ).toBe(0);
  });
});
