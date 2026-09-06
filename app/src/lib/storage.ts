import type { Habit } from '../types'

const STORAGE_KEY = 'habit-tracker'
const SCHEMA_VERSION = 1

type StoredPayload = {
  version: number
  habits: Habit[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * localStorage is user-editable and may hold data written by an older build,
 * so every field is checked instead of trusting `JSON.parse` and casting.
 */
function parseHabit(value: unknown): Habit | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>

  const { id, name, icon, checkIns } = candidate
  if (typeof id !== 'string' || id === '') return null
  if (typeof name !== 'string' || name === '') return null
  if (typeof icon !== 'string') return null
  if (!Array.isArray(checkIns)) return null

  const validDays = checkIns.filter(
    (day): day is string => typeof day === 'string' && ISO_DATE.test(day),
  )

  return {
    id,
    name,
    icon: icon as Habit['icon'],
    // Deduplicated on the way in — a duplicate day would inflate the stats.
    checkIns: [...new Set(validDays)],
  }
}

/**
 * Returns `null` only when nothing usable is stored. An empty array is a
 * meaningful value (the user deleted everything) and must not re-seed demo data.
 */
export function loadHabits(): Habit[] | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage disabled (private mode, blocked cookies) — run without it.
    return null
  }
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPayload>
    if (parsed?.version !== SCHEMA_VERSION) return null
    if (!Array.isArray(parsed.habits)) return null

    const habits = parsed.habits
      .map(parseHabit)
      .filter((habit): habit is Habit => habit !== null)

    // Drop ids that collide, otherwise React keys and toggles would misbehave.
    const seen = new Set<string>()
    return habits.filter((habit) => {
      if (seen.has(habit.id)) return false
      seen.add(habit.id)
      return true
    })
  } catch {
    return null
  }
}

const buildPayload = (habits: Habit[]): StoredPayload => ({
  version: SCHEMA_VERSION,
  habits,
})

/** `false` means the write failed and the change exists only in memory. */
export function saveHabits(habits: Habit[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload(habits)))
    return true
  } catch {
    return false
  }
}

/*
 * There is deliberately no `clearHabits`. Clearing is just `setHabits([])`:
 * the persistence effect is the single writer, so a `removeItem` here would be
 * immediately undone by the effect writing the new (empty) state back.
 */

/**
 * Size of what the next write will store, for the Settings summary.
 *
 * Derived from state rather than read back from localStorage: the write happens
 * in an effect *after* render, so reading the key during render always reported
 * the previous value — the counter lagged one change behind.
 */
export function serializedSize(habits: Habit[]): number {
  return JSON.stringify(buildPayload(habits)).length
}
