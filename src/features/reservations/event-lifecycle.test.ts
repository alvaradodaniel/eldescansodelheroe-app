import { describe, expect, it } from "vitest";
import {
  hasEventPassed,
  isEventPubliclyVisible,
  PUBLIC_EVENT_RETENTION_MS,
} from "./event-lifecycle";

describe("public event lifecycle", () => {
  it("marks an event as past at its start time", () => {
    const startsAt = new Date(1_000);
    expect(hasEventPassed(startsAt, 1_000)).toBe(true);
    expect(hasEventPassed(startsAt, 999)).toBe(false);
  });

  it("keeps past events visible for exactly two days", () => {
    const startsAt = new Date(1_000);
    expect(isEventPubliclyVisible(startsAt, 1_000 + PUBLIC_EVENT_RETENTION_MS - 1)).toBe(true);
    expect(isEventPubliclyVisible(startsAt, 1_000 + PUBLIC_EVENT_RETENTION_MS)).toBe(false);
  });
});
