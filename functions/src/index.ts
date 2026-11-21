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
