import { useEffect, useState } from "react";

import { subscribePublishedEvents } from "./event-repository";
import type { FirestoreEvent } from "./types";

export interface PublishedEventsState {
  events: FirestoreEvent[];
  loading: boolean;
  error: Error | null;
}

export function usePublishedEvents(): PublishedEventsState {
  const [state, setState] = useState<PublishedEventsState>({
    events: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState((currentState) => ({ ...currentState, loading: true, error: null }));

    return subscribePublishedEvents(
      (events) => {
        setState({ events, loading: false, error: null });
      },
      (error) => {
        setState({ events: [], loading: false, error });
      },
    );
  }, []);

  return state;
}
