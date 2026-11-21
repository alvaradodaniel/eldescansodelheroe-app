import { useEffect, useState } from "react";
import { subscribeEvent } from "./event-repository";
import type { FirestoreEvent } from "./types";

export function useEvent(eventId: string) {
  const [state, setState] = useState<{
    event: FirestoreEvent | null;
    loading: boolean;
    error: Error | null;
  }>({ event: null, loading: true, error: null });
  useEffect(() => {
    setState({ event: null, loading: true, error: null });
    return subscribeEvent(
      eventId,
      (event) => setState({ event, loading: false, error: null }),
      (error) => setState({ event: null, loading: false, error }),
    );
  }, [eventId]);
  return state;
}
