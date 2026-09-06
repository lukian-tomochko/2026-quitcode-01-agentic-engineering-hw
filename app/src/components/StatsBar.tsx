import { PTag } from '@porsche-design-system/components-react'
import { currentStreak } from '../lib/dates'
import type { Habit, IsoDate } from '../types'

type Props = {
  habits: Habit[]
  days: IsoDate[]
  today: IsoDate
}

export function StatsBar({ habits, days, today }: Props) {
  const doneToday = habits.filter((h) => h.checkIns.includes(today)).length

  // Set lookup, not `days.includes` — check-in history grows without bound.
  const window = new Set(days)
  const slots = habits.length * days.length
  const filled = habits.reduce(
    (sum, h) => sum + h.checkIns.filter((d) => window.has(d)).length,
    0,
  )
  const completion = slots === 0 ? 0 : Math.round((filled / slots) * 100)

  // Longest streak still running right now — not an all-time record.
  const topStreak = habits.reduce(
    (max, h) => Math.max(max, currentStreak(h.checkIns)),
    0,
  )

  return (
    <div className="stats-bar">
      <PTag
        icon="check"
        variant={
          habits.length > 0 && doneToday === habits.length ? 'success' : 'info'
        }
      >
        {`Today ${doneToday}/${habits.length}`}
      </PTag>
      <PTag icon="chart">{`Last ${days.length} days ${completion}%`}</PTag>
      <PTag icon="stopwatch">{`Top streak ${topStreak}d`}</PTag>
    </div>
  )
}
