import type { IconName } from '@porsche-design-system/components-react'
import type { Habit, IsoDate } from '../types'

export type HabitDraft = {
  name: string
  icon: IconName
}

/**
 * Flips a single day for a single habit, returning a new array.
 *
 * Removal filters rather than slicing out one index, so a check-in that was
 * somehow recorded twice cannot survive a toggle and skew the stats.
 */
export function toggleCheckIn(
  habits: Habit[],
  habitId: string,
  day: IsoDate,
): Habit[] {
  return habits.map((habit) => {
    if (habit.id !== habitId) return habit

    return {
      ...habit,
      checkIns: habit.checkIns.includes(day)
        ? habit.checkIns.filter((checkIn) => checkIn !== day)
        : [...habit.checkIns, day],
    }
  })
}

export function addHabit(habits: Habit[], draft: HabitDraft): Habit[] {
  return [
    ...habits,
    {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      icon: draft.icon,
      checkIns: [],
    },
  ]
}

/** Renaming or re-icons a habit. Check-in history is deliberately preserved. */
export function editHabit(
  habits: Habit[],
  habitId: string,
  draft: HabitDraft,
): Habit[] {
  return habits.map((habit) =>
    habit.id === habitId
      ? { ...habit, name: draft.name.trim(), icon: draft.icon }
      : habit,
  )
}

export function removeHabit(habits: Habit[], habitId: string): Habit[] {
  return habits.filter((habit) => habit.id !== habitId)
}

/**
 * Case- and whitespace-insensitive, so "Morning run" and "morning  run " count
 * as the same habit. `exceptId` lets a habit keep its own name while editing.
 */
export function isDuplicateName(
  habits: Habit[],
  name: string,
  exceptId?: string,
): boolean {
  const normalise = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ')
  const target = normalise(name)

  return habits.some(
    (habit) => habit.id !== exceptId && normalise(habit.name) === target,
  )
}
