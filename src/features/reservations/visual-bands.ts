import { RESTAURANT_TIMEZONE } from "./timezone";

const RAINBOW_BANDS = [
  "band-provision",
  "band-otros",
  "band-bestiario",
  "band-croacoco",
  "band-lattes",
  "band-banquete",
  "band-pociones",
] as const;

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function getEventBand(date: Date): string {
  if (Number.isNaN(date.getTime())) return RAINBOW_BANDS[0] ?? "band-provision";
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: RESTAURANT_TIMEZONE,
  })
    .format(date)
    .toLowerCase();
  const index = WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);
  return RAINBOW_BANDS[index < 0 ? 0 : index] ?? "band-provision";
}

export function getTableBand(index: number): string {
  const normalizedIndex = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return RAINBOW_BANDS[normalizedIndex % RAINBOW_BANDS.length] ?? "band-provision";
}
