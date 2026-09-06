import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PAccordion,
  PButton,
  PButtonPure,
  PCheckbox,
  PHeading,
  PInlineNotification,
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
import { lastDays, longDateLabel } from '../lib/dates'
import {
  DRIVERS,
  ENERGY_LABELS,
  NOTE_MAX_LENGTH,
  SCALE_VALUES,
  VALENCE_LABELS,
  driverEmoji,
  driverLabel,
  loadMoods,
  loggedStreak,
  moodFace,
  moodPrompt,
  moodStateLabel,
  removeEntry,
  saveMoods,
  topDrivers,
  upsertEntry,
  valenceVariant,
  windowStats,
  type DriverId,
  type MoodV2Entry,
  type Scale,
} from '../lib/moodV2'
import { MoodTrend } from './MoodTrend'
import type { IsoDate } from '../types'

const FORM_ID = 'mood-v2-form'
const TREND_DAYS = 14
/** Long enough to register the confirmation, short enough not to sit there. */
const FLASH_MS = 2400

type Props = {
  today: IsoDate
}

/**
 * Mood v.2 — a check-in built to cost a few seconds, not a few minutes.
 *
 * The three design decisions that make it fast, in the order they matter:
 *
 * 1. It is always today. No date picker: a "log the past" flow is what turns a
 *    daily check-in into a chore, and the original Mood tab already covers it.
 * 2. It opens pre-filled. Today's entry if it exists, otherwise yesterday's
 *    values — mood is strongly autocorrelated day to day, so the previous
 *    reading is a far better starting guess than a blank form, and the guess
 *    means the whole check-in can be a single click on Save.
 * 3. Nothing is required except the two axes that are already set. Drivers and
 *    the note are optional and the note is folded away, so the form can never
 *    grow into something that has to be "finished".
 */
export function MoodV2View({ today }: Props) {
  // Same pattern as the habit store: `null` means nothing was ever saved, an
  // empty array means the user has no entries, and neither seeds demo data.
  const [entries, setEntries] = useState<MoodV2Entry[]>(() => loadMoods() ?? [])
  const [saveFailed, setSaveFailed] = useState(false)
  const saveFailedRef = useRef(false)

  const todayEntry = useMemo(
    () => entries.find((entry) => entry.day === today),
    [entries, today],
  )
  // Newest entry that is not today — the prefill source when today is blank.
  const lastEntry = useMemo(
    () => entries.find((entry) => entry.day !== today),
    [entries, today],
  )

  const seed = todayEntry ?? lastEntry
  const [valence, setValence] = useState<Scale>(seed?.valence ?? 3)
  const [energy, setEnergy] = useState<Scale>(seed?.energy ?? 3)
  // Drivers and notes are day-specific: carrying yesterday's reasons over would
  // put words in the user's mouth, so they only prefill when editing today.
  const [drivers, setDrivers] = useState<DriverId[]>(todayEntry?.drivers ?? [])
  const [note, setNote] = useState(todayEntry?.note ?? '')

  const [flash, setFlash] = useState<'saved' | 'updated' | null>(null)
  // PAccordion is fully controlled: without `open` + `onUpdate` the panel never
  // opens, so the note and the history would be unreachable.
  const [noteOpen, setNoteOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const failed = !saveMoods(entries)
    // Only re-render on an actual transition, so a save never costs an extra
    // render on the happy path.
    if (failed !== saveFailedRef.current) {
      saveFailedRef.current = failed
      setSaveFailed(failed)
    }
  }, [entries])

  useEffect(() => {
    if (flash === null) return
    const timer = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])

  const days = useMemo(
    () => lastDays(TREND_DAYS, new Date(`${today}T12:00:00`)),
    [today],
  )
  const stats = useMemo(() => windowStats(entries, days), [entries, days])
  const streak = useMemo(() => loggedStreak(entries, today), [entries, today])
  const drivers7 = useMemo(
    () => topDrivers(entries, days.slice(-7)),
    [entries, days],
  )

  const toggleDriver = useCallback((id: DriverId, checked: boolean) => {
    setDrivers((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((driver) => driver !== id),
    )
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const wasLogged = todayEntry !== undefined

    setEntries((current) =>
      upsertEntry(current, {
        day: today,
        valence,
        energy,
        drivers,
        note: note.trim().slice(0, NOTE_MAX_LENGTH),
        savedAt: Date.now(),
      }),
    )
    setFlash(wasLogged ? 'updated' : 'saved')
  }

  const handleRemove = (day: IsoDate) => {
    setEntries((current) => removeEntry(current, day))
    if (day === today) {
      // Back to the neutral middle rather than to the deleted values, so the
      // form does not immediately re-offer what was just thrown away.
      setValence(3)
      setEnergy(3)
      setDrivers([])
      setNote('')
    }
  }

  const face = moodFace(valence, energy)
  const state = moodStateLabel(valence, energy)
  const prefilled = todayEntry === undefined && lastEntry !== undefined

  return (
    <div className="moodv2">
      {saveFailed && (
        <PInlineNotification
          heading="Mood entries are not being saved"
          headingTag="h2"
          description="This browser blocked local storage, so today's check-in will be lost when you reload."
          state="warning"
          dismissButton={false}
        />
      )}

      <form id={FORM_ID} className="moodv2__form" onSubmit={handleSubmit}>
        <div
          className={`moodv2-hero moodv2-hero--v${valence}`}
          // The class above picks the accent colour; `--moodv2-energy` drives
          // the pulse speed — more energy, faster pulse. Both resolve to PDS
          // tokens in the stylesheet, so no colour or duration lives here.
          style={
            { '--moodv2-energy': String(energy) } as React.CSSProperties
          }
        >
          <div className="moodv2-hero__halo" aria-hidden="true" />
          <span
            // Re-keyed on every value change so the pop animation replays
            // instead of only running on mount.
            key={`${valence}-${energy}-${flash ?? ''}`}
            className={
              flash ? 'moodv2-hero__face moodv2-hero__face--flash' : 'moodv2-hero__face'
            }
            role="img"
            aria-label={`${state}: ${VALENCE_LABELS[valence]}, ${ENERGY_LABELS[energy]}`}
          >
            {face}
          </span>

          {flash !== null && (
            <div className="moodv2-hero__flash" role="status">
              <PTag icon="check" variant="success">
                {flash === 'updated'
                  ? 'Updated'
                  : streak > 1
                    ? `Logged · ${streak} days in a row`
                    : 'Logged'}
              </PTag>
            </div>
          )}

          <div className="moodv2-hero__copy">
            <PHeading tag="h2" size="lg">
              {state}
            </PHeading>
            <PText color="contrast-medium">
              {VALENCE_LABELS[valence]} · {ENERGY_LABELS[energy]}
            </PText>
            <PText size="sm" color="contrast-medium">
              {moodPrompt(valence, energy)}
            </PText>
          </div>
        </div>


        <PSegmentedControl
          name="valence"
          label="How does it feel?"
          description="Unpleasant → pleasant."
          value={valence}
          columns={5}
          onChange={(e) => setValence(e.detail.value as Scale)}
        >
          {SCALE_VALUES.map((value) => (
            <PSegmentedControlItem key={value} value={value}>
              {VALENCE_LABELS[value]}
            </PSegmentedControlItem>
          ))}
        </PSegmentedControl>

        <PSegmentedControl
          name="energy"
          label="How much energy?"
          description="Drained → wired. This is the axis a single mood score hides."
          value={energy}
          columns={5}
          onChange={(e) => setEnergy(e.detail.value as Scale)}
        >
          {SCALE_VALUES.map((value) => (
            <PSegmentedControlItem key={value} value={value}>
              {ENERGY_LABELS[value]}
            </PSegmentedControlItem>
          ))}
        </PSegmentedControl>

        <fieldset className="moodv2-drivers">
          <legend className="moodv2-drivers__legend">
            <PText weight="semibold">What is driving it?</PText>
            <PText size="sm" color="contrast-medium">
              Optional — tap any that apply.
            </PText>
          </legend>

          <div className="moodv2-drivers__row">
            {DRIVERS.map((driver) => (
              <PCheckbox
                key={driver.id}
                className="moodv2-drivers__item"
                name={`driver-${driver.id}`}
                label={`${driver.emoji} ${driver.label}`}
                compact
                checked={drivers.includes(driver.id)}
                onChange={(e) =>
                  toggleDriver(
                    driver.id,
                    (e.target as HTMLInputElement).checked,
                  )
                }
              />
            ))}
          </div>
        </fieldset>

        <PAccordion
          heading="Add a note (optional)"
          compact
          open={noteOpen}
          onUpdate={(e) => setNoteOpen(e.detail.open)}
        >
          <PTextarea
            name="note"
            label="Note"
            hideLabel
            description="One line is plenty — naming the cause is what makes the entry useful later."
            value={note}
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            counter
            onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
          />
        </PAccordion>

        <div className="moodv2__actions">
          <PButton type="submit" icon={todayEntry ? 'edit' : 'check'}>
            {todayEntry ? "Update today's mood" : 'Save today'}
          </PButton>
          <PText size="sm" color="contrast-medium">
            {todayEntry
              ? `${longDateLabel(today)} · logged${todayEntry.savedAt ? ` at ${new Date(todayEntry.savedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}`
              : prefilled
                ? 'Pre-filled from your last check-in — change what moved, or just save.'
                : `${longDateLabel(today)} · one click is enough`}
          </PText>
        </div>
      </form>

      <div className="moodv2-stats">
        <PTag icon="stopwatch">{`Streak ${streak}d`}</PTag>
        <PTag
          icon="chart"
          variant={stats.valence === null ? 'info' : valenceVariant(
            Math.round(stats.valence) as Scale,
          )}
        >
          {stats.valence === null
            ? `Last ${TREND_DAYS} days —`
            : `Pleasantness ${stats.valence.toFixed(1)}/5`}
        </PTag>
        <PTag icon="flash">
          {stats.energy === null
            ? 'Energy —'
            : `Energy ${stats.energy.toFixed(1)}/5`}
        </PTag>
        <PTag icon="calendar">{`${stats.logged}/${TREND_DAYS} days logged`}</PTag>
        {drivers7.length > 0 && (
          <PTag icon="information">
            {`Top driver ${driverEmoji(drivers7[0].id)} ${driverLabel(drivers7[0].id)} ×${drivers7[0].count}`}
          </PTag>
        )}
      </div>

      {entries.length === 0 ? (
        <PInlineNotification
          heading="Nothing logged yet"
          headingTag="h2"
          description="Save today above. From the second entry on, the strip below shows the shape of the last two weeks."
          state="info"
          dismissButton={false}
        />
      ) : (
        <MoodTrend days={days} entries={entries} today={today} />
      )}

      {entries.length > 0 && (
        <PAccordion
          heading={`History (${entries.length})`}
          compact
          open={historyOpen}
          onUpdate={(e) => setHistoryOpen(e.detail.open)}
        >
          <PTable caption="Every mood entry, newest first">
            <PTableHead>
              <PTableHeadRow>
                <PTableHeadCell>Day</PTableHeadCell>
                <PTableHeadCell>State</PTableHeadCell>
                <PTableHeadCell>Drivers</PTableHeadCell>
                <PTableHeadCell>Note</PTableHeadCell>
                <PTableHeadCell hideLabel>Actions</PTableHeadCell>
              </PTableHeadRow>
            </PTableHead>

            <PTableBody>
              {entries.map((entry) => (
                <PTableRow key={entry.day}>
                  <PTableCell>
                    <PText weight="semibold">
                      {entry.day === today ? 'Today' : longDateLabel(entry.day)}
                    </PText>
                  </PTableCell>
                  <PTableCell>
                    <span className="moodv2-history__state">
                      <span aria-hidden="true">
                        {moodFace(entry.valence, entry.energy)}
                      </span>
                      <PTag compact variant={valenceVariant(entry.valence)}>
                        {moodStateLabel(entry.valence, entry.energy)}
                      </PTag>
                    </span>
                  </PTableCell>
                  <PTableCell>
                    <PText color="contrast-medium">
                      {entry.drivers.length === 0
                        ? '—'
                        : entry.drivers.map(driverLabel).join(', ')}
                    </PText>
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
        </PAccordion>
      )}
    </div>
  )
}
