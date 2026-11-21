import { useEffect, useState } from "react";

import { subscribeEventTables } from "./event-repository";
import type { FirestoreTable } from "./types";

export interface EventTablesState {
  tables: FirestoreTable[];
  loading: boolean;
  error: Error | null;
}

export function useEventTables(eventId: string | null): EventTablesState {
  const [state, setState] = useState<EventTablesState>({
    tables: [],
    loading: Boolean(eventId),
    error: null,
  });

  useEffect(() => {
    if (!eventId) {
      setState({ tables: [], loading: false, error: null });
      return;
    }

    setState({ tables: [], loading: true, error: null });

    return subscribeEventTables(
      eventId,
      (tables) => {
        setState({ tables, loading: false, error: null });
      },
      (error) => {
        setState({ tables: [], loading: false, error });
      },
    );
  }, [eventId]);

  return state;
}
