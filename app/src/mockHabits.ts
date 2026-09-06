import { addDays, toIsoDate } from './lib/dates'
import type { Habit } from './types'

/**
 * Temporary seed data for iteration 1 — replaced by localStorage in a later
 * iteration. Offsets are relative to today (0 = today, 1 = yesterday, ...) so
 * the grid stays populated whenever the app is opened.
 */
const seed: Array<Omit<Habit, 'checkIns'> & { doneDaysAgo: number[] }> = [
  {
    id: 'morning-run',
    name: 'Morning run',
    icon: 'stopwatch',
    doneDaysAgo: [0, 1, 2, 4, 6],
  },
  {
    id: 'read',
    name: 'Read 20 pages',
    icon: 'document',
    doneDaysAgo: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'meditate',
    name: 'Meditate 10 min',
    icon: 'leaf',
    doneDaysAgo: [1, 3, 5],
  },
  {
    id: 'no-sugar',
    name: 'No sugar',
    icon: 'disable',
    doneDaysAgo: [2, 3, 4, 5],
  },
  {
    id: 'learn-spanish',
    name: 'Learn Spanish',
    icon: 'brain',
    doneDaysAgo: [0, 2, 3],
  },
]

export function createMockHabits(today = new Date()): Habit[] {
  return seed.map(({ doneDaysAgo, ...habit }) => ({
    ...habit,
    checkIns: doneDaysAgo.map((daysAgo) => toIsoDate(addDays(today, -daysAgo))),
  }))
}
