import type { IsoDate } from '../types'

/**
 * Mood v2 records the two axes of Russell's circumplex model of affect instead
 * of a single "how good was your day" scale:
 *
 *   valence — how pleasant it feels (unpleasant → pleasant)
 *   energy  — arousal / activation (drained → wired)
 *
 * Two axes are what separate "calm" from "flat", or "excited" from "anxious" —
 * states a one-dimensional 1..5 scale collapses into the same number. Two taps
 * still fit inside a few seconds.
 */
export type Scale = 1 | 2 | 3 | 4 | 5

export const SCALE_VALUES: Scale[] = [1, 2, 3, 4, 5]

export type MoodV2Entry = {
  day: IsoDate
  valence: Scale
  energy: Scale
  /** Optional context tags — what the user thinks drove the mood. */
  drivers: DriverId[]
  note: string
  /** Epoch ms of the last save, so the UI can show when today was logged. */
  savedAt: number
}

export const VALENCE_LABELS: Record<Scale, string> = {
  1: 'Rough',
  2: 'Meh',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
}

export const ENERGY_LABELS: Record<Scale, string> = {
  1: 'Drained',
  2: 'Low',
  3: 'Steady',
  4: 'Lively',
  5: 'Wired',
}

/*
 * Drivers are the everyday factors that move self-reported mood the most:
 * sleep, work strain, social contact, the body, movement, rest. Kept to six so
 * the row stays one glance and one tap, never a survey.
 */
export const DRIVERS = [
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'people', label: 'People', emoji: '💬' },
  { id: 'body', label: 'Body', emoji: '🩺' },
  { id: 'movement', label: 'Movement', emoji: '🏃' },
  { id: 'downtime', label: 'Downtime', emoji: '🛋️' },
] as const

export type DriverId = (typeof DRIVERS)[number]['id']

const DRIVER_IDS = new Set<string>(DRIVERS.map((driver) => driver.id))

export const driverLabel = (id: DriverId) =>
  DRIVERS.find((driver) => driver.id === id)?.label ?? id

export const driverEmoji = (id: DriverId) =>
  DRIVERS.find((driver) => driver.id === id)?.emoji ?? '•'

/*
 * The full 5x5 grid: energy 1..5 as rows, valence 1..5 as columns. Every cell
 * is a distinct face, because the point of the second axis is that the feedback
 * visibly changes when you move it — otherwise the input feels ignored.
 */
const FACES: Record<Scale, Record<Scale, string>> = {
  1: { 1: '😫', 2: '😪', 3: '😴', 4: '😌', 5: '🥰' },
  2: { 1: '😔', 2: '😕', 3: '😶', 4: '🙃', 5: '😇' },
  3: { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😊' },
  4: { 1: '😠', 2: '😟', 3: '😯', 4: '😄', 5: '😁' },
  5: { 1: '😡', 2: '😖', 3: '😳', 4: '😃', 5: '🤩' },
}

export const moodFace = (valence: Scale, energy: Scale) => FACES[energy][valence]

/**
 * Plain-language name for the quadrant, so the reflection is one word instead
 * of two numbers. Putting a feeling into words ("affect labelling") is the part
 * of mood tracking that does the work — it measurably takes the edge off.
 */
export function moodStateLabel(valence: Scale, energy: Scale): string {
  const pleasant = valence >= 4
  const unpleasant = valence <= 2
  const high = energy >= 4
  const low = energy <= 2

  if (pleasant && high) return 'Energised'
  if (pleasant && low) return 'Calm'
  if (unpleasant && high) return 'Stressed'
  if (unpleasant && low) return 'Depleted'
  if (pleasant) return 'Content'
  if (unpleasant) return 'Off'
  if (high) return 'Restless'
  if (low) return 'Flat'
  return 'Balanced'
}

/** One short, non-prescriptive line per quadrant. Never advice, never alarm. */
export function moodPrompt(valence: Scale, energy: Scale): string {
  switch (moodStateLabel(valence, energy)) {
    case 'Energised':
      return 'Good fuel — worth spending on something that matters to you.'
    case 'Calm':
      return 'Pleasant and low-key. The state most people forget to record.'
    case 'Stressed':
      return 'High activation, low comfort. A slow exhale is a real intervention.'
    case 'Depleted':
      return 'Low on both axes. Rest counts as maintenance, not as a reward.'
    case 'Content':
      return 'Quietly fine. The ordinary days are what make a trend readable.'
    case 'Off':
      return 'Noted. One day is data, not a verdict.'
    case 'Restless':
      return 'Activated but unsettled — movement usually resolves this one.'
    case 'Flat':
      return 'Flat is a reading, not a failure. It often follows a busy stretch.'
    default:
      return 'Read the trend below, not any single day.'
  }
}

/** Green from "Good" upwards, matching how the rest of the app tags state. */
export const valenceVariant = (valence: Scale) =>
  valence >= 4 ? 'success' : valence === 3 ? 'info' : 'warning'

/* ------------------------------------------------------------------ stats */

/** Mean of a set of readings, or `null` when the window is empty. */
function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function windowStats(entries: MoodV2Entry[], days: IsoDate[]) {
  const window = new Set(days)
  const inWindow = entries.filter((entry) => window.has(entry.day))

  return {
    logged: inWindow.length,
    valence: mean(inWindow.map((entry) => entry.valence)),
    energy: mean(inWindow.map((entry) => entry.energy)),
  }
}

/**
 * Consecutive logged days ending today. Today not being logged yet does not
 * break the streak — the day is not over.
 */
export function loggedStreak(entries: MoodV2Entry[], today: IsoDate): number {
  const logged = new Set(entries.map((entry) => entry.day))
  // Local noon, so a DST shift can never move the cursor across a day boundary.
  const cursor = new Date(`${today}T12:00:00`)
  if (!logged.has(today)) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (streak < logged.size + 1) {
    const iso = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-')
    if (!logged.has(iso)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Most frequently tagged drivers in the window, most common first. */
export function topDrivers(
  entries: MoodV2Entry[],
  days: IsoDate[],
): Array<{ id: DriverId; count: number }> {
  const window = new Set(days)
  const counts = new Map<DriverId, number>()

  for (const entry of entries) {
    if (!window.has(entry.day)) continue
    for (const driver of entry.drivers) {
      counts.set(driver, (counts.get(driver) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
}

/* ---------------------------------------------------------------- storage */

/** Own key, own schema — Mood v2 never reads or writes the habit store. */
const STORAGE_KEY = 'habit-tracker-mood-v2'
const SCHEMA_VERSION = 1
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const NOTE_MAX_LENGTH = 140

type StoredPayload = {
  version: number
  entries: MoodV2Entry[]
}

const isScale = (value: unknown): value is Scale =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5

/**
 * localStorage is user-editable and may hold data written by an older build, so
 * every field is checked instead of trusting `JSON.parse` and casting.
 */
function parseEntry(value: unknown): MoodV2Entry | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>

  const { day, valence, energy, drivers, note, savedAt } = candidate
  if (typeof day !== 'string' || !ISO_DATE.test(day)) return null
  if (!isScale(valence) || !isScale(energy)) return null

  const validDrivers = Array.isArray(drivers)
    ? drivers.filter(
        (id): id is DriverId => typeof id === 'string' && DRIVER_IDS.has(id),
      )
    : []

  return {
    day,
    valence,
    energy,
    drivers: [...new Set(validDrivers)],
    note: typeof note === 'string' ? note.slice(0, NOTE_MAX_LENGTH) : '',
    savedAt:
      typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : 0,
  }
}

/** `null` only when nothing usable is stored; `[]` means the user cleared it. */
export function loadMoods(): MoodV2Entry[] | null {
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
    if (!Array.isArray(parsed.entries)) return null

    const entries = parsed.entries
      .map(parseEntry)
      .filter((entry): entry is MoodV2Entry => entry !== null)

    // One entry per day is the whole model; a duplicate day would double-count
    // in every average above.
    const seen = new Set<IsoDate>()
    return entries
      .filter((entry) => {
        if (seen.has(entry.day)) return false
        seen.add(entry.day)
        return true
      })
      .sort((a, b) => b.day.localeCompare(a.day))
  } catch {
    return null
  }
}

/** `false` means the write failed and the change exists only in memory. */
export function saveMoods(entries: MoodV2Entry[]): boolean {
  const payload: StoredPayload = { version: SCHEMA_VERSION, entries }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

/** Insert or replace the entry for `entry.day`, newest day first. */
export function upsertEntry(
  entries: MoodV2Entry[],
  entry: MoodV2Entry,
): MoodV2Entry[] {
  return [...entries.filter((item) => item.day !== entry.day), entry].sort(
    (a, b) => b.day.localeCompare(a.day),
  )
}

export function removeEntry(
  entries: MoodV2Entry[],
  day: IsoDate,
): MoodV2Entry[] {
  return entries.filter((entry) => entry.day !== day)
}
