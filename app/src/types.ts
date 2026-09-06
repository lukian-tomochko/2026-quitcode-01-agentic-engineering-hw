import type { IconName } from '@porsche-design-system/components-react'

/** Calendar day in `YYYY-MM-DD`, always in the user's local timezone. */
export type IsoDate = string

export type Habit = {
  id: string
  name: string
  /** Icon from the PDS icon set, shown next to the habit name. */
  icon: IconName
  /** Days the habit was checked off. Unordered, unique. */
  checkIns: IsoDate[]
}
