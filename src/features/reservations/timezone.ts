export const RESTAURANT_TIMEZONE = "America/Chihuahua";

function partsAt(instant: number, formatter: Intl.DateTimeFormat): Record<string, string> {
  return Object.fromEntries(
    formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]),
  );
}

function wallTimeMillis(instant: number, formatter: Intl.DateTimeFormat): number {
  const parts = partsAt(instant, formatter);
  return Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]),
    Number(parts["minute"]),
  );
}

function makeFormatter(timeZone = RESTAURANT_TIMEZONE): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function toChihuahuaDateTimeInput(date: Date): string {
  const parts = partsAt(date.getTime(), makeFormatter());
  return `${parts["year"]}-${parts["month"]}-${parts["day"]}T${parts["hour"]}:${parts["minute"]}`;
}

/** Convert a wall-clock datetime in the restaurant timezone to an ISO instant. */
export function chihuahuaDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Completa las fechas y horas del evento.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error("La fecha u hora no es válida.");
  }
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(wallTime);
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute
  ) {
    throw new Error("La fecha u hora no es válida.");
  }

  const formatter = makeFormatter();
  const hourMs = 60 * 60 * 1000;
  const offsets = new Set(
    [-36, 0, 36].map((delta) => {
      const sample = wallTime + delta * hourMs;
      return wallTimeMillis(sample, formatter) - sample;
    }),
  );
  const matches = [...offsets]
    .map((offset) => wallTime - offset)
    .filter((candidate) => wallTimeMillis(candidate, formatter) === wallTime);

  if (matches.length === 0) {
    throw new Error("Esa hora local no existe por el cambio de horario. Elige otra hora.");
  }
  if (matches.length > 1) {
    throw new Error("Esa hora local ocurre dos veces por el cambio de horario. Elige otra hora.");
  }
  return new Date(matches[0]!).toISOString();
}

function dateKeyFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Next upcoming Saturday at 18:00 and Friday before it at 12:00 in Chihuahua. */
export function getNextEventDateDefaults(now = new Date()): { startsAt: string; opensAt: string } {
  const parts = partsAt(
    now.getTime(),
    new Intl.DateTimeFormat("en-US", {
      timeZone: RESTAURANT_TIMEZONE,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = parts["weekday"];
  if (!weekday || weekdays[weekday] === undefined)
    throw new Error("No se pudo determinar el día local.");
  const today = new Date(
    Date.UTC(Number(parts["year"]), Number(parts["month"]) - 1, Number(parts["day"])),
  );
  const daysUntilSaturday = (6 - weekdays[weekday]!) % 7;
  let saturday = new Date(today.getTime() + daysUntilSaturday * 86_400_000);
  let startsAt = `${dateKeyFromUtc(saturday)}T18:00`;
  if (Date.parse(chihuahuaDateTimeToIso(startsAt)) <= now.getTime()) {
    saturday = new Date(saturday.getTime() + 7 * 86_400_000);
    startsAt = `${dateKeyFromUtc(saturday)}T18:00`;
  }
  const friday = new Date(saturday.getTime() - 86_400_000);
  return {
    startsAt,
    opensAt: `${dateKeyFromUtc(friday)}T12:00`,
  };
}
