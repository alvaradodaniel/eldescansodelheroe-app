import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FirestoreEvent } from "./types";

const subscriptions = vi.hoisted(() => ({
  eventsNext: vi.fn(),
  eventsError: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("./event-repository", () => ({
  subscribePublishedEvents: (
    next: (events: FirestoreEvent[]) => void,
    error: (error: Error) => void,
  ) => {
    subscriptions.eventsNext.mockImplementation(next);
    subscriptions.eventsError.mockImplementation(error);
    return subscriptions.unsubscribe;
  },
}));

describe("usePublishedEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads published events and reflects live listener updates", async () => {
    const { usePublishedEvents } = await import("./use-published-events");
    const hook = renderHook(() => usePublishedEvents());
    expect(hook.result.current.loading).toBe(true);

    const event = { id: "event-a", name: "Noche de juegos" } as FirestoreEvent;
    act(() => subscriptions.eventsNext([event]));

    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
      expect(hook.result.current.events).toEqual([event]);
    });

    act(() => subscriptions.eventsNext([]));
    expect(hook.result.current.events).toEqual([]);
  });

  it("exposes listener errors with an empty event list", async () => {
    const { usePublishedEvents } = await import("./use-published-events");
    const hook = renderHook(() => usePublishedEvents());
    const error = new Error("offline");

    act(() => subscriptions.eventsError(error));

    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
      expect(hook.result.current.error).toBe(error);
      expect(hook.result.current.events).toEqual([]);
    });
  });
});
