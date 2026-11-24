import { describe, expect, it } from "vitest";
import { getEventBand, getTableBand } from "./visual-bands";

describe("visual bands", () => {
  it("assigns events a rainbow color by weekday in Chihuahua", () => {
    expect(getEventBand(new Date("2026-11-23T18:00:00.000Z"))).toBe("band-provision");
    expect(getEventBand(new Date("2026-11-24T18:00:00.000Z"))).toBe("band-otros");
    expect(getEventBand(new Date("2026-11-29T18:00:00.000Z"))).toBe("band-pociones");
  });

  it("cycles table colors by their display order", () => {
    expect(getTableBand(0)).not.toBe(getTableBand(1));
    expect(getTableBand(7)).toBe(getTableBand(0));
  });
});
