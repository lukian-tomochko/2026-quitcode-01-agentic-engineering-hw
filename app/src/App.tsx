import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PHeading,
  PInlineNotification,
  PTabsBar,
  PText,
} from '@porsche-design-system/components-react'
import { HabitGrid } from './components/HabitGrid'
import { HabitsView } from './components/HabitsView'
import { MoodV2View } from './components/MoodV2View'
import { MoodView } from './components/MoodView'
import { SettingsView } from './components/SettingsView'
import { StatsBar } from './components/StatsBar'
import { lastDays, longDateLabel, toIsoDate } from './lib/dates'
import {
  addHabit,
  editHabit,
  removeHabit,
  toggleCheckIn,
  type HabitDraft,
} from './lib/habits'
import { clearMoods } from './lib/moodV2'
import { loadHabits, saveHabits } from './lib/storage'
import { createMockHabits } from './mockHabits'
import type { IsoDate } from './types'
import './App.css'

const VISIBLE_DAYS = 7

/*
 * 'Mood' is the original scratch tab (session-only, any day). 'Mood v.2' is the
 * fast today-only check-in with its own store — they are deliberately separate
 * so v1 keeps working untouched.
 */
const TABS = ['Overview', 'Habits', 'Mood', 'Mood v.2', 'Settings'] as const

function App() {
  const [activeTab, setActiveTab] = useState(0)

  // One clock reading shared by every date-aware child, so the grid columns and
  // the streaks can never disagree about which day it is.
  const [now, setNow] = useState(() => new Date())

  /*
   * ...but a reading taken at mount goes stale: a tab left open overnight kept
   * showing yesterday. Re-read the clock just after the next local midnight,
   * which reschedules itself because `now` is the dependency.
   */
  useEffect(() => {
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    // A second of slack so the timer cannot fire a hair before the day flips.
    const delay = nextMidnight.getTime() - now.getTime() + 1_000

    const timer = setTimeout(() => setNow(new Date()), delay)
    return () => clearTimeout(timer)
  }, [now])

  // `loadHabits` returns null only when nothing is stored. A stored empty array
  // means the user cleared everything, so it must not bring the demo data back.
  const [habits, setHabits] = useState(
    () => loadHabits() ?? createMockHabits(now),
  )
  const [saveFailed, setSaveFailed] = useState(false)
  const saveFailedRef = useRef(false)

  useEffect(() => {
    const failed = !saveHabits(habits)
    // Only re-render on an actual transition; a plain setState here would cost
    // an extra render on every single check-in.
    if (failed !== saveFailedRef.current) {
      saveFailedRef.current = failed
      setSaveFailed(failed)
    }
  }, [habits])

  const { days, today } = useMemo(
    () => ({ days: lastDays(VISIBLE_DAYS, now), today: toIsoDate(now) }),
    [now],
  )

  const handleToggle = useCallback((habitId: string, day: IsoDate) => {
    setHabits((current) => toggleCheckIn(current, habitId, day))
  }, [])

  const handleAdd = useCallback((draft: HabitDraft) => {
    setHabits((current) => addHabit(current, draft))
  }, [])

  const handleEdit = useCallback((habitId: string, draft: HabitDraft) => {
    setHabits((current) => editHabit(current, habitId, draft))
  }, [])

  const handleDelete = useCallback((habitId: string) => {
    setHabits((current) => removeHabit(current, habitId))
  }, [])

  /*
   * Mood v.2 keeps its own localStorage key, so clearing habits alone left it
   * behind. Bumping `dataVersion` remounts the mood view so it re-reads the
   * emptied store immediately, instead of only after a reload.
   */
  const [dataVersion, setDataVersion] = useState(0)

  const handleClearAll = useCallback(() => {
    clearMoods()
    setHabits([])
    setDataVersion((version) => version + 1)
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <PHeading tag="h1" size="2xl">
          Habit Tracker
        </PHeading>
        <PText color="contrast-medium">{longDateLabel(today)}</PText>
      </header>

      {saveFailed && (
        <PInlineNotification
          heading="Changes are not being saved"
          headingTag="h2"
          description="This browser blocked local storage, so anything you change now will be lost when you reload."
          state="warning"
          dismissButton={false}
        />
      )}

      <PTabsBar
        activeTabIndex={activeTab}
        onUpdate={(e) => setActiveTab(e.detail.activeTabIndex)}
      >
        {TABS.map((tab) => (
          <button key={tab} type="button">
            {tab}
          </button>
        ))}
      </PTabsBar>

      <section className="app__panel">
        {activeTab === 0 &&
          (habits.length === 0 ? (
            <PInlineNotification
              heading="Nothing to track yet"
              headingTag="h2"
              description="Add a habit on the Habits tab and it will show up here."
              state="info"
              dismissButton={false}
            />
          ) : (
            <>
              <StatsBar habits={habits} days={days} today={today} />
              <HabitGrid
                habits={habits}
                days={days}
                today={today}
                onToggle={handleToggle}
              />
              <PText size="xs" color="contrast-medium">
                Click any day to check a habit in or out. Changes are saved in
                this browser automatically.
              </PText>
            </>
          ))}

        {activeTab === 1 && (
          <HabitsView
            habits={habits}
            today={today}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 2 && <MoodView today={today} />}

        {activeTab === 3 && (
          <MoodV2View key={dataVersion} today={today} />
        )}

        {activeTab === 4 && (
          <SettingsView habits={habits} onClearAll={handleClearAll} />
        )}
      </section>
    </main>
  )
}

export default App
