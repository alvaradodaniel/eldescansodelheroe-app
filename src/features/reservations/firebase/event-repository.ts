import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseFirestore } from "@/lib/firebase";

import type { EventDocument, FirestoreEvent, FirestoreTable, TableDocument } from "./types";

const eventsCollection = collection(firebaseFirestore, "events");

function readEvent(snapshot: DocumentSnapshot<DocumentData>): FirestoreEvent {
  return {
    ...(snapshot.data() as EventDocument),
    id: snapshot.id,
  };
}

function readTable(snapshot: DocumentSnapshot<DocumentData>): FirestoreTable {
  return {
    ...(snapshot.data() as TableDocument),
    id: snapshot.id,
  };
}

export function subscribePublishedEvents(
  onNext: (events: FirestoreEvent[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const publishedEventsQuery = query(
    eventsCollection,
    where("status", "in", ["published", "cancelled"]),
  );

  return onSnapshot(
    publishedEventsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      onNext(snapshot.docs.map(readEvent));
    },
    onError,
  );
}

export function subscribeEvent(
  eventId: string,
  onNext: (event: FirestoreEvent | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(eventsCollection, eventId),
    (snapshot) => {
      onNext(snapshot.exists() ? readEvent(snapshot) : null);
    },
    onError,
  );
}

export function subscribeEventTables(
  eventId: string,
  onNext: (tables: FirestoreTable[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const tablesCollection = collection(firebaseFirestore, "events", eventId, "tables");

  return onSnapshot(
    query(tablesCollection, orderBy("name", "asc")),
    (snapshot: QuerySnapshot<DocumentData>) => {
      onNext(snapshot.docs.map(readTable));
    },
    onError,
  );
}
