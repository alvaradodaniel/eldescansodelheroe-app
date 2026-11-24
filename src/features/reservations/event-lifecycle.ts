export const PUBLIC_EVENT_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

export function hasEventPassed(startsAt: Date, now = Date.now()): boolean {
  return startsAt.getTime() <= now;
}

export function isEventPubliclyVisible(startsAt: Date, now = Date.now()): boolean {
  return startsAt.getTime() + PUBLIC_EVENT_RETENTION_MS > now;
}
