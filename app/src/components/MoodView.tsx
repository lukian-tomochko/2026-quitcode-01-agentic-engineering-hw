import { useState } from 'react'
import {
  PButton,
  PButtonPure,
  PInlineNotification,
  PInputDate,
  PSegmentedControl,
  PSegmentedControlItem,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PTag,
  PText,
  PTextarea,
} from '@porsche-design-system/components-react'
import { longDateLabel } from '../lib/dates'
import type { IsoDate } from '../types'

const FORM_ID = 'mood-form'
const NOTE_MAX_LENGTH = 140

type MoodLevel = 1 | 2 | 3 | 4 | 5

const MOOD_LEVELS: Array<{ value: MoodLevel; label: string }> = [
  { value: 1, label: 'Awful' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
]

const moodLabel = (level: MoodLevel) =>
  MOOD_LEVELS.find((mood) => mood.value === level)?.label ?? '—'

/** Green from "Okay" upwards, so the tag reads at a glance. */
const moodVariant = (level: MoodLevel) =>
  level >= 4 ? 'success' : level === 3 ? 'warning' : 'error'

type MoodEntry = {
  day: IsoDate
  level: MoodLevel
  note: string
}

type Props = {
  today: IsoDate
}

/**
 * Temporary tab: a single form for logging one mood entry per day.
 *
 * Entries live in component state only — this is a scratch tab, so nothing is
 * written to localStorage and a reload starts over.
 */
export function MoodView({ today }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>([])

  const [day, setDay] = useState<IsoDate>(today)
  const [level, setLevel] = useState<MoodLevel | null>(null)
  const [note, setNote] = useState('')

  const inFuture = day !== '' && day > today
  const duplicate = entries.some((entry) => entry.day === day)
  const dayError = inFuture
    ? 'Pick today or an earlier day.'
    : duplicate
      ? 'This day is already logged — remove that entry first or pick another day.'
      : ''

  // An unpicked mood only disables the button; no error shouted at an
  // untouched form.
  const canSubmit = day !== '' && dayError === '' && level !== null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    const entry: MoodEntry = { day, level, note: note.trim() }
    // Newest first, so the day just logged lands at the top.
    setEntries((current) =>
      [...current, entry].sort((a, b) => b.day.localeCompare(a.day)),
    )

    setDay(today)
    setLevel(null)
    setNote('')
  }

  const handleRemove = (target: IsoDate) => {
    setEntries((current) => current.filter((entry) => entry.day !== target))
  }

  return (
    <>
      <form id={FORM_ID} className="mood-form" onSubmit={handleSubmit}>
        <PInputDate
          name="day"
          label="Day"
          description="Which day this mood is for."
          value={day}
          max={today}
          required
          state={dayError ? 'error' : 'none'}
          message={dayError}
          onInput={(e) => setDay((e.target as HTMLInputElement).value)}
        />

        <PSegmentedControl
          name="level"
          label="Mood"
          description="How the day felt overall."
          value={level}
          columns={5}
          required
          onChange={(e) => setLevel(e.detail.value as MoodLevel)}
        >
          {MOOD_LEVELS.map((mood) => (
            <PSegmentedControlItem key={mood.value} value={mood.value}>
              {mood.label}
            </PSegmentedControlItem>
          ))}
        </PSegmentedControl>

        <PTextarea
          name="note"
          label="Note"
          description="Optional — what drove the mood."
          value={note}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          counter
          onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
        />

        <div className="mood-form__actions">
          <PButton type="submit" icon="plus" disabled={!canSubmit}>
            Log mood
          </PButton>
        </div>
      </form>

      {entries.length === 0 ? (
        <PInlineNotification
          heading="No moods logged yet"
          headingTag="h2"
          description="Log a day above to see it here. This tab is temporary, so entries are not saved between reloads."
          state="info"
          dismissButton={false}
        />
      ) : (
        <PTable caption="Logged moods (this session only)">
          <PTableHead>
            <PTableHeadRow>
              <PTableHeadCell>Day</PTableHeadCell>
              <PTableHeadCell>Mood</PTableHeadCell>
              <PTableHeadCell>Note</PTableHeadCell>
              <PTableHeadCell hideLabel>Actions</PTableHeadCell>
            </PTableHeadRow>
          </PTableHead>

          <PTableBody>
            {entries.map((entry) => (
              <PTableRow key={entry.day}>
                <PTableCell>
                  <PText weight="semibold">{longDateLabel(entry.day)}</PText>
                </PTableCell>
                <PTableCell>
                  <PTag compact variant={moodVariant(entry.level)}>
                    {moodLabel(entry.level)}
                  </PTag>
                </PTableCell>
                <PTableCell>
                  <PText color="contrast-medium">{entry.note || '—'}</PText>
                </PTableCell>
                <PTableCell>
                  <PButtonPure
                    type="button"
                    icon="delete"
                    hideLabel
                    onClick={() => handleRemove(entry.day)}
                  >
                    {`Remove entry for ${entry.day}`}
                  </PButtonPure>
                </PTableCell>
              </PTableRow>
            ))}
          </PTableBody>
        </PTable>
      )}
    </>
  )
}
