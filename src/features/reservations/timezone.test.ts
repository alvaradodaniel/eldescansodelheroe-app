import { describe, expect, it } from "vitest";

import {
  chihuahuaDateTimeToIso,
  getNextEventDateDefaults,
  toChihuahuaDateTimeInput,
} from "./timezone";

describe("restaurant timezone helpers", () => {
  it("round-trips a wall-clock value in Chihuahua", () => {
    const iso = chihuahuaDateTimeToIso("2026-11-28T18:00");
    expect(toChihuahuaDateTimeInput(new Date(iso))).toBe("2026-11-28T18:00");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => chihuahuaDateTimeToIso("2026-02-30T12:00")).toThrow("no es válida");
    expect(() => chihuahuaDateTimeToIso("2026-11-28T25:00")).toThrow("no es válida");
  });

  it("rejects local wall times missing or repeated by historical daylight-saving changes", () => {
    expect(() => chihuahuaDateTimeToIso("2021-04-04T02:30")).toThrow("no existe");
    expect(() => chihuahuaDateTimeToIso("2021-10-31T01:30")).toThrow("ocurre dos veces");
  });

  it("defaults to the next Saturday and the previous Friday in Chihuahua", () => {
    const defaults = getNextEventDateDefaults(new Date("2026-11-23T18:00:00.000Z"));
    expect(defaults).toEqual({
      startsAt: "2026-11-28T18:00",
      opensAt: "2026-11-27T12:00",
    });
  });

  it("moves to the following Saturday when opened after Saturday's event time", () => {
    const defaults = getNextEventDateDefaults(new Date("2026-11-29T02:00:00.000Z"));
    expect(defaults.startsAt).toBe("2026-12-05T18:00");
    expect(defaults.opensAt).toBe("2026-12-04T12:00");
  });
});
