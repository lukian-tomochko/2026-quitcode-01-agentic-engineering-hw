import type { IconName } from '@porsche-design-system/components-react'

/**
 * A curated slice of the 360-icon PDS set. Offering all of them would make the
 * picker unusable; these cover the common habit categories.
 */
export const HABIT_ICONS: Array<{ value: IconName; label: string }> = [
  { value: 'stopwatch', label: 'Exercise' },
  { value: 'weight', label: 'Strength' },
  { value: 'document', label: 'Reading' },
  { value: 'brain', label: 'Learning' },
  { value: 'leaf', label: 'Mindfulness' },
  { value: 'heart', label: 'Health' },
  { value: 'sun', label: 'Morning' },
  { value: 'moon', label: 'Sleep' },
  { value: 'disable', label: 'Avoid' },
  { value: 'globe', label: 'Language' },
  { value: 'work', label: 'Work' },
  { value: 'user-group', label: 'Social' },
]

export const DEFAULT_HABIT_ICON: IconName = HABIT_ICONS[0].value
