import { describe, expect, it } from "vitest";

import { getTableState } from "./table-state";
import type { GameTable } from "./types";

const table = (over: Partial<GameTable> = {}): GameTable => ({
  id: "t",
  name: "Mesa",
  game: "D&D",
  host: "DM",
  capacity: 6,
  taken: 0,
  ...over,
});

describe("getTableState", () => {
  it("shows a table with every seat taken as full", () => {
    expect(getTableState(table({ taken: 6 }), "open")).toBe("full");
  });

  it("never shows an over-booked table as available", () => {
    expect(getTableState(table({ taken: 7 }), "open")).toBe("full");
  });

  it("locks free tables before reservations open", () => {
    expect(getTableState(table({ taken: 1 }), "published")).toBe("locked");
  });

  it("marks tables closed by staff as closed even if seats remain", () => {
    expect(getTableState(table({ closed: true }), "open")).toBe("closed");
  });

  it("marks every table closed when the event is closed", () => {
    expect(getTableState(table(), "closed")).toBe("closed");
  });

  it("flags the last two seats as 'últimos lugares'", () => {
    expect(getTableState(table({ taken: 4 }), "open")).toBe("low");
    expect(getTableState(table({ taken: 3 }), "open")).toBe("open");
  });
});
