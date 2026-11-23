import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/https";

import { adminDb } from "./firebase-admin.js";
import { isDocumentId, isNonEmptyString } from "./validation.js";

type AdminRequest<T> = CallableRequest<T>;

function assertAdmin(request: AdminRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
  return uid;
}

function requiredText(value: unknown, name: string, max: number): string {
  if (!isNonEmptyString(value) || value.trim().length > max) {
    throw new HttpsError(
      "invalid-argument",
      `${name} must be a non-empty string of at most ${max} characters.`,
    );
  }
  return value.trim();
}

function dateTimestamp(value: unknown, name: string): Timestamp {
  const isoDate =
    typeof value === "string"
      ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
          value,
        )
      : null;
  if (!isoDate)
    throw new HttpsError("invalid-argument", `${name} must be an ISO date with a timezone.`);
  const [, year, month, day, hour, minute, second] = isoDate.map(Number);
  const normalized = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!));
  if (
    year! < 1000 ||
    normalized.getUTCFullYear() !== year! ||
    normalized.getUTCMonth() !== month! - 1 ||
    normalized.getUTCDate() !== day! ||
    normalized.getUTCHours() !== hour! ||
    normalized.getUTCMinutes() !== minute! ||
    normalized.getUTCSeconds() !== second!
  ) {
    throw new HttpsError("invalid-argument", `${name} must be a valid date.`);
  }
  const date = new Date(isoDate[0]);
  if (Number.isNaN(date.getTime()))
    throw new HttpsError("invalid-argument", `${name} must be a valid date.`);
  return Timestamp.fromDate(date);
}

const EVENT_STATUSES = ["draft", "published", "closed", "cancelled"] as const;
const RESTAURANT_TIMEZONE = "America/Chihuahua";
const BANDS = [
  "band-provision",
  "band-banquete",
  "band-bestiario",
  "band-postres",
  "band-pociones",
  "band-lattes",
  "band-cafes",
  "band-otros",
  "band-temporada",
  "band-sylhar",
  "band-croacoco",
] as const;

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type Weekday = (typeof WEEKDAYS)[number];
interface WeeklyTableTemplate {
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

function createDefaultWeeklyTemplates(): WeeklyTableTemplates {
  const hosts: Partial<Record<Weekday, string[]>> = {
    tuesday: ["Edd", "Emilio"],
    wednesday: ["Edgar", "DK"],
    thursday: ["Muerto", "Laura"],
    friday: ["Chris", "Raúl"],
    saturday: ["Sefer"],
    sunday: ["DK", "Raúl"],
  };
  return {
    days: Object.fromEntries(
      WEEKDAYS.map((day) => [
        day,
        hosts[day]
          ? hosts[day]!.map((host, index) => ({
              id: `${day}-mesa-${index + 1}`,
              name: `Mesa ${index + 1}`,
              host,
              capacity: 4,
              status: "active" as const,
              game: "",
              description: "",
              closedReason: "",
            }))
          : [],
      ]),
    ) as Record<Weekday, WeeklyTableTemplate[]>,
  };
}

function validateWeeklyTemplates(value: unknown): WeeklyTableTemplates {
  const input = value as { days?: Record<string, unknown> } | null;
  if (!input?.days || typeof input.days !== "object") {
    throw new HttpsError("invalid-argument", "Weekly template data is required.");
  }
  const days = {} as Record<Weekday, WeeklyTableTemplate[]>;
  for (const day of WEEKDAYS) {
    const rows = input.days[day];
    if (!Array.isArray(rows) || rows.length > 20) {
      throw new HttpsError(
        "invalid-argument",
        `Template for ${day} must contain at most 20 tables.`,
      );
    }
    days[day] = rows.map((row: unknown) => {
      if (!row || typeof row !== "object") {
        throw new HttpsError("invalid-argument", `A table in ${day} is invalid.`);
      }
      const table = row as Partial<WeeklyTableTemplate>;
      if (!isDocumentId(table.id))
        throw new HttpsError("invalid-argument", "Template table id is invalid.");
      if (
        !Number.isInteger(table.capacity) ||
        Number(table.capacity) < 1 ||
        Number(table.capacity) > 100
      ) {
        throw new HttpsError("invalid-argument", "Template capacity must be between 1 and 100.");
      }
      if (table.status !== "active" && table.status !== "closed") {
        throw new HttpsError("invalid-argument", "Template table status is invalid.");
      }
      return {
        id: table.id,
        name: requiredText(table.name, "table name", 100),
        host: requiredText(table.host, "master/host", 100),
        capacity: Number(table.capacity),
        status: table.status,
        game: typeof table.game === "string" ? table.game.trim().slice(0, 100) : "",
        description:
          typeof table.description === "string" ? table.description.trim().slice(0, 500) : "",
        closedReason:
          typeof table.closedReason === "string" ? table.closedReason.trim().slice(0, 200) : "",
      };
    });
  }
  return { days };
}

function weekdayForDate(date: Date): Weekday {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase() as Weekday;
  if (!(WEEKDAYS as readonly string[]).includes(weekday)) {
    throw new HttpsError("internal", "Could not determine the event weekday.");
  }
  return weekday;
}

const weeklyTemplatesRef = adminDb.doc("adminConfig/weeklyTableTemplates");

export async function adminGetWeeklyTemplatesHandler(request: AdminRequest<unknown>) {
  assertAdmin(request);
  const snapshot = await weeklyTemplatesRef.get();
  return snapshot.exists
    ? validateWeeklyTemplates(snapshot.data())
    : createDefaultWeeklyTemplates();
}

export async function adminSaveWeeklyTemplatesHandler(request: AdminRequest<WeeklyTableTemplates>) {
  assertAdmin(request);
  const templates = validateWeeklyTemplates(request.data);
  await weeklyTemplatesRef.set({ ...templates, updatedAt: FieldValue.serverTimestamp() });
  return { saved: true };
}

export interface AdminSaveEventData {
  eventId?: string;
  name: string;
  description: string;
  startsAt: string;
  opensAt: string;
  band: string;
  status: string;
}

export async function adminSaveEventHandler(request: AdminRequest<AdminSaveEventData>) {
  assertAdmin(request);
  const data = request.data;
  if (!data || typeof data !== "object")
    throw new HttpsError("invalid-argument", "Event data is required.");
  if (data.eventId !== undefined && !isDocumentId(data.eventId))
    throw new HttpsError("invalid-argument", "eventId is invalid.");
  if (!(EVENT_STATUSES as readonly string[]).includes(data.status))
    throw new HttpsError("invalid-argument", "Event status is invalid.");
  if (!(BANDS as readonly string[]).includes(data.band))
    throw new HttpsError("invalid-argument", "Event band is invalid.");

  const startsAt = dateTimestamp(data.startsAt, "startsAt");
  const opensAt = dateTimestamp(data.opensAt, "opensAt");
  if (opensAt.toMillis() > startsAt.toMillis()) {
    throw new HttpsError("invalid-argument", "Reservations must open before the event starts.");
  }

  const eventFields = {
    name: requiredText(data.name, "name", 100),
    description: typeof data.description === "string" ? data.description.trim().slice(0, 2000) : "",
    startsAt,
    opensAt,
    timezone: RESTAURANT_TIMEZONE,
    band: data.band,
    status: data.status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (data.eventId) {
    const eventRef = adminDb.doc(`events/${data.eventId}`);
    const eventSnapshot = await eventRef.get();
    if (!eventSnapshot.exists) throw new HttpsError("not-found", "Event not found.");
    await eventRef.set(eventFields, { merge: true });
    return { eventId: eventRef.id };
  }

  const eventRef = adminDb.collection("events").doc();
  await adminDb.runTransaction(async (transaction) => {
    const templateSnapshot = await transaction.get(weeklyTemplatesRef);
    const templates = templateSnapshot.exists
      ? validateWeeklyTemplates(templateSnapshot.data())
      : createDefaultWeeklyTemplates();
    const weekday = weekdayForDate(startsAt.toDate());
    const eventTables = templates.days[weekday];

    transaction.create(eventRef, {
      ...eventFields,
      createdAt: FieldValue.serverTimestamp(),
    });
    for (const template of eventTables) {
      const tableRef = eventRef.collection("tables").doc();
      transaction.create(tableRef, {
        name: template.name,
        host: template.host,
        game: template.game || "Juego de mesa",
        description: template.description,
        capacity: template.capacity,
        reservedCount: 0,
        status: template.status,
        closedReason: template.closedReason,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
  return { eventId: eventRef.id };
}

export interface AdminSaveTableData {
  eventId: string;
  tableId?: string;
  name: string;
  capacity: number;
  status: "active" | "closed";
  game?: string;
  host: string;
  description?: string;
  closedReason?: string;
}

export async function adminSaveTableHandler(request: AdminRequest<AdminSaveTableData>) {
  assertAdmin(request);
  const data = request.data;
  if (!data || !isDocumentId(data.eventId))
    throw new HttpsError("invalid-argument", "eventId is required.");
  if (data.tableId !== undefined && !isDocumentId(data.tableId))
    throw new HttpsError("invalid-argument", "tableId is invalid.");
  if (!Number.isInteger(data.capacity) || data.capacity < 1 || data.capacity > 100) {
    throw new HttpsError("invalid-argument", "capacity must be an integer between 1 and 100.");
  }
  if (data.status !== "active" && data.status !== "closed")
    throw new HttpsError("invalid-argument", "Table status is invalid.");

  const eventRef = adminDb.doc(`events/${data.eventId}`);
  const tableRef = data.tableId
    ? eventRef.collection("tables").doc(data.tableId)
    : eventRef.collection("tables").doc();
  const tableFields = {
    name: requiredText(data.name, "name", 100),
    capacity: data.capacity,
    status: data.status,
    game: isNonEmptyString(data.game) ? data.game.trim().slice(0, 100) : "Juego de mesa",
    host: requiredText(data.host, "master/host", 100),
    description: typeof data.description === "string" ? data.description.trim().slice(0, 500) : "",
    closedReason:
      typeof data.closedReason === "string" ? data.closedReason.trim().slice(0, 200) : "",
    updatedAt: FieldValue.serverTimestamp(),
  };
  await adminDb.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (!eventSnapshot.exists) throw new HttpsError("not-found", "Event not found.");
    const existing = data.tableId ? await transaction.get(tableRef) : null;
    if (existing && !existing.exists) throw new HttpsError("not-found", "Table not found.");
    const rawReservedCount = existing?.data()?.reservedCount ?? 0;
    if (
      typeof rawReservedCount !== "number" ||
      !Number.isInteger(rawReservedCount) ||
      rawReservedCount < 0
    ) {
      throw new HttpsError("failed-precondition", "Table reservation count is inconsistent.");
    }
    if (data.capacity < rawReservedCount) {
      throw new HttpsError(
        "failed-precondition",
        "Capacity cannot be lower than the number of confirmed reservations.",
      );
    }
    const table = { ...tableFields, reservedCount: rawReservedCount };
    if (existing) transaction.set(tableRef, table, { merge: true });
    else transaction.set(tableRef, { ...table, createdAt: FieldValue.serverTimestamp() });
  });
  return { tableId: tableRef.id };
}

export interface AdminCancelReservationData {
  eventId: string;
  uid: string;
}

export async function adminCancelReservationHandler(
  request: AdminRequest<AdminCancelReservationData>,
) {
  assertAdmin(request);
  const data = request.data;
  if (!data || !isDocumentId(data.eventId) || !isDocumentId(data.uid)) {
    throw new HttpsError("invalid-argument", "eventId and uid are required.");
  }
  const eventRef = adminDb.doc(`events/${data.eventId}`);
  const reservationRef = eventRef.collection("reservations").doc(data.uid);
  await adminDb.runTransaction(async (transaction) => {
    const [eventSnapshot, reservationSnapshot] = await transaction.getAll(eventRef, reservationRef);
    if (!eventSnapshot.exists) throw new HttpsError("not-found", "Event not found.");
    if (!reservationSnapshot.exists) throw new HttpsError("not-found", "Reservation not found.");
    const reservation = reservationSnapshot.data() as { tableId?: string; status?: string };
    if (reservation.status !== "confirmed" || !isDocumentId(reservation.tableId)) {
      throw new HttpsError("failed-precondition", "Reservation is not confirmed.");
    }
    const tableRef = eventRef.collection("tables").doc(reservation.tableId);
    const tableSnapshot = await transaction.get(tableRef);
    if (!tableSnapshot.exists) throw new HttpsError("not-found", "Reserved table not found.");
    const reservedCount = tableSnapshot.data()?.reservedCount;
    if (
      typeof reservedCount !== "number" ||
      !Number.isInteger(reservedCount) ||
      reservedCount < 1
    ) {
      throw new HttpsError("failed-precondition", "Table reservation count is inconsistent.");
    }
    const now = FieldValue.serverTimestamp();
    transaction.update(tableRef, { reservedCount: reservedCount - 1, updatedAt: now });
    transaction.update(reservationRef, { status: "cancelled", cancelledAt: now, updatedAt: now });
  });
  return { cancelled: true };
}
