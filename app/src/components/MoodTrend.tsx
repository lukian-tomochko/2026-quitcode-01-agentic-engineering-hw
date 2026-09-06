import { PText } from '@porsche-design-system/components-react'
import { dayLabel, longDateLabel, weekdayLabel } from '../lib/dates'
import { moodFace, type MoodV2Entry } from '../lib/moodV2'
import type { IsoDate } from '../types'

type Props = {
  /** Oldest first — the strip and the line both read left to right. */
  days: IsoDate[]
  entries: MoodV2Entry[]
  today: IsoDate
}

// The line is drawn in a fixed viewBox and scaled by CSS, so the geometry below
// never has to care about the rendered width.
const VIEW_WIDTH = 100
const VIEW_HEIGHT = 34
const PADDING_Y = 6

/** Valence 1..5 → y, inverted so "Great" sits at the top of the chart. */
const scaleY = (valence: number) => {
  const span = VIEW_HEIGHT - PADDING_Y * 2
  return PADDING_Y + span - ((valence - 1) / 4) * span
}

export function MoodTrend({ days, entries, today }: Props) {
  const byDay = new Map(entries.map((entry) => [entry.day, entry]))

  const points = days
    .map((day, index) => {
      const entry = byDay.get(day)
      if (!entry) return null
      return {
        day,
        // Centre of the day's column, not its left edge — that is what puts
        // each point directly above its face in the strip below.
        x: ((index + 0.5) / days.length) * VIEW_WIDTH,
        y: scaleY(entry.valence),
      }
    })
    .filter((point): point is { day: IsoDate; x: number; y: number } =>
      point !== null,
    )

  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  // Closed down to the baseline so the area under the line can be filled.
  const area =
    points.length > 1
      ? `${points[0].x},${VIEW_HEIGHT} ${line} ${points[points.length - 1].x},${VIEW_HEIGHT}`
      : ''

  return (
    <div className="moodv2-trend">
      {points.length > 1 && (
        <svg
          className="moodv2-trend__chart"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Pleasantness over the last ${days.length} days`}
        >
          <polygon className="moodv2-trend__area" points={area} />
          <polyline className="moodv2-trend__line" points={line} />
        </svg>
      )}

      <ol className="moodv2-strip">
        {days.map((day, index) => {
          const entry = byDay.get(day)
          return (
            <li
              className="moodv2-strip__day"
              key={day}
              // Staggered so the strip flows in left to right on first paint.
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span
                className={
                  entry
                    ? 'moodv2-strip__face'
                    : 'moodv2-strip__face moodv2-strip__face--empty'
                }
                title={
                  entry
                    ? `${longDateLabel(day)} — ${entry.valence}/5 pleasant, ${entry.energy}/5 energy`
                    : `${longDateLabel(day)} — not logged`
                }
                aria-hidden={entry === undefined}
              >
                {entry ? moodFace(entry.valence, entry.energy) : '·'}
              </span>
              <PText size="xs" color="contrast-medium">
                {day === today ? 'Today' : weekdayLabel(day)}
              </PText>
              <PText size="2xs" color="contrast-medium">
                {dayLabel(day)}
              </PText>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
