import { onCall } from "firebase-functions/https";
import { setGlobalOptions } from "firebase-functions/options";

/**
 * Cloud Functions 2nd gen region for this project.
 *
 * Firestore remains in northamerica-south1. That location is not listed as a
 * Cloud Functions location, so future functions must use a supported nearby
 * region rather than recreating or moving the database.
 */
export const FUNCTIONS_REGION = "us-south1";

setGlobalOptions({ region: FUNCTIONS_REGION });

export const reserveSeat = onCall(async (request) => {
  const { reserveSeatHandler } = await import("./reserve-seat.js");
  return reserveSeatHandler(request);
});

export const cancelReservation = onCall(async (request) => {
  const { cancelReservationHandler } = await import("./cancel-reservation.js");
  return cancelReservationHandler(request);
});

export const adminSaveEvent = onCall(async (request) => {
  const { adminSaveEventHandler } = await import("./admin.js");
  return adminSaveEventHandler(request);
});

export const adminDeleteEvent = onCall(async (request) => {
  const { adminDeleteEventHandler } = await import("./admin.js");
  return adminDeleteEventHandler(request);
});

export const adminGetWeeklyTemplates = onCall(async (request) => {
  const { adminGetWeeklyTemplatesHandler } = await import("./admin.js");
  return adminGetWeeklyTemplatesHandler(request);
});

export const adminSaveWeeklyTemplates = onCall(async (request) => {
  const { adminSaveWeeklyTemplatesHandler } = await import("./admin.js");
  return adminSaveWeeklyTemplatesHandler(request);
});

export const adminSaveTable = onCall(async (request) => {
  const { adminSaveTableHandler } = await import("./admin.js");
  return adminSaveTableHandler(request);
});

export const adminDeleteTable = onCall(async (request) => {
  const { adminDeleteTableHandler } = await import("./admin.js");
  return adminDeleteTableHandler(request);
});

export const adminCancelReservation = onCall(async (request) => {
  const { adminCancelReservationHandler } = await import("./admin.js");
  return adminCancelReservationHandler(request);
});
