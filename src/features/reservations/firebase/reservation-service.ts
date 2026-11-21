import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebaseFirestore, firebaseFunctions } from "@/lib/firebase";

export interface ActiveReservation {
  eventId: string;
  tableId: string;
  uid: string;
  nickname: string;
  status: "confirmed" | "cancelled";
}

export function subscribeOwnReservation(
  eventId: string,
  uid: string,
  next: (reservation: ActiveReservation | null) => void,
  error: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firebaseFirestore, "events", eventId, "reservations", uid),
    (snapshot) => {
      next(snapshot.exists() ? (snapshot.data() as ActiveReservation) : null);
    },
    error,
  );
}

const reserveCall = httpsCallable(firebaseFunctions, "reserveSeat");
const cancelCall = httpsCallable(firebaseFunctions, "cancelReservation");

export async function reserveSeat(input: { eventId: string; tableId: string; nickname: string }) {
  return reserveCall(input);
}

export async function cancelReservation(input: { eventId: string }) {
  return cancelCall(input);
}

export function reservationErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const detail =
    typeof error === "object" && error && "message" in error
      ? String(error.message).toLowerCase()
      : "";
  if (code.includes("unauthenticated"))
    return "Tu sesión no está lista. Recarga la página e inténtalo de nuevo.";
  if (code.includes("already-exists")) return "Ya tienes una reserva activa para este evento.";
  if (detail.includes("table is full"))
    return "La mesa se llenó mientras reservabas. Actualizamos la disponibilidad; elige otra mesa.";
  if (detail.includes("table is closed"))
    return "La mesa se cerró y ya no acepta reservas. Elige otra mesa disponible.";
  if (detail.includes("event is not open"))
    return "Este evento cerró y ya no recibe reservaciones.";
  if (detail.includes("reservations are not open yet"))
    return "Las reservaciones de este evento todavía no abren.";
  if (detail.includes("table capacity data is inconsistent"))
    return "La configuración de esta mesa no es válida. Inténtalo más tarde.";
  if (detail.includes("table reservation count is inconsistent"))
    return "No se pudo liberar el lugar por una inconsistencia en la mesa. Contacta al restaurante.";
  if (detail.includes("cannot be cancelled after the event starts"))
    return "Ya inició el evento y la política actual no permite cancelar después del inicio.";
  if (detail.includes("already cancelled")) return "Esta reserva ya fue cancelada.";
  if (code.includes("failed-precondition"))
    return "No se pudo completar la operación porque el evento o la reserva cambiaron. Actualizamos la información; inténtalo de nuevo.";
  if (code.includes("not-found")) return "El evento o la mesa ya no está disponible.";
  if (code.includes("unavailable") || code.includes("deadline-exceeded"))
    return "No pudimos conectar. Comprueba tu conexión e inténtalo de nuevo.";
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
