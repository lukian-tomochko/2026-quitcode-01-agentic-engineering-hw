import {
  PButtonPure,
  PIcon,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PTag,
  PText,
} from '@porsche-design-system/components-react'
import {
  currentStreak,
  dayLabel,
  longDateLabel,
  weekdayLabel,
} from '../lib/dates'
import type { Habit, IsoDate } from '../types'

type Props = {
  habits: Habit[]
  /** Columns of the grid, oldest first. */
  days: IsoDate[]
  today: IsoDate
  onToggle: (habitId: string, day: IsoDate) => void
}

export function HabitGrid({ habits, days, today, onToggle }: Props) {
  return (
    <PTable caption={`Habit check-ins for the last ${days.length} days`}>
      <PTableHead>
        <PTableHeadRow>
          <PTableHeadCell>Habit</PTableHeadCell>
          {days.map((day) => (
            <PTableHeadCell key={day}>
              <span className="day-head" title={longDateLabel(day)}>
                <PText size="xs" color="contrast-medium">
                  {weekdayLabel(day)}
                </PText>
                <PText
                  size="sm"
                  weight={day === today ? 'semibold' : 'normal'}
                  color={day === today ? 'primary' : 'contrast-medium'}
                >
                  {dayLabel(day)}
                </PText>
              </span>
            </PTableHeadCell>
          ))}
          <PTableHeadCell>Streak</PTableHeadCell>
        </PTableHeadRow>
      </PTableHead>

      <PTableBody>
        {habits.map((habit) => {
          const done = new Set(habit.checkIns)
          const streak = currentStreak(habit.checkIns)

          return (
            <PTableRow key={habit.id}>
              <PTableCell>
                <span className="habit-name">
                  <PIcon name={habit.icon} color="contrast-high" />
                  <PText weight="semibold">{habit.name}</PText>
                </span>
              </PTableCell>

              {days.map((day) => {
                const isDone = done.has(day)
                return (
                  <PTableCell key={day}>
                    <span
                      className={`check-mark${isDone ? ' check-mark--done' : ''}`}
                    >
                      {/*
                        `color="inherit"` lets the wrapper drive the icon colour
                        from a PDS token — PButtonPure has no `success` colour.
                      */}
                      <PButtonPure
                        type="button"
                        icon={isDone ? 'success' : 'minus'}
                        color="inherit"
                        hideLabel
                        aria={{ 'aria-pressed': isDone }}
                        onClick={() => onToggle(habit.id, day)}
                      >
                        {`${habit.name}, ${longDateLabel(day)}`}
                      </PButtonPure>
                    </span>
                  </PTableCell>
                )
              })}

              <PTableCell>
                <PTag compact variant={streak > 0 ? 'success' : 'secondary'}>
                  {`${streak}d`}
                </PTag>
              </PTableCell>
            </PTableRow>
          )
        })}
      </PTableBody>
    </PTable>
  )
}
