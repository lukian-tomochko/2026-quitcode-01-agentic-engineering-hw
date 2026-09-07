import type { IsoDate } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Local-time `YYYY-MM-DD`. Deliberately not `toISOString()`, which converts to
 * UTC and would report the wrong calendar day for most of the world.
 */
export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Parsed at local noon so DST shifts can never bump the day across a boundary. */
export function fromIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/** The last `count` calendar days, oldest first, ending on `today`. */
export function lastDays(count: number, today = new Date()): IsoDate[] {
  return Array.from({ length: count }, (_, i) =>
    toIsoDate(addDays(today, i - count + 1)),
  )
}

export function weekdayLabel(iso: IsoDate): string {
  return fromIsoDate(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

export function dayLabel(iso: IsoDate): string {
  return pad(fromIsoDate(iso).getDate())
}

export function longDateLabel(iso: IsoDate): string {
  return fromIsoDate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Consecutive checked-off days ending today. A habit not yet done *today* keeps
 * its streak until the day is over, so counting starts at yesterday in that case.
 *
 * `today` is required on purpose. It used to default to `new Date()`, which let
 * callers silently read the system clock while the rest of the UI worked from
 * the day App captured — so after midnight the grid and the streaks disagreed.
 * Making it explicit turns that into a compile error instead of a wrong number.
 */
export function currentStreak(checkIns: IsoDate[], today: IsoDate): number {
  const done = new Set(checkIns)
  let cursor = fromIsoDate(today)
  if (!done.has(today)) cursor = addDays(cursor, -1)
  let streak = 0

  while (done.has(toIsoDate(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
