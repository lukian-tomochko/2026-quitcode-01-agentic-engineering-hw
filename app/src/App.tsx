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

  // One clock reading for the whole mount, so the grid columns and the seeded
  // check-ins can never straddle midnight.
  const [now] = useState(() => new Date())

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

  const handleClearAll = useCallback(() => setHabits([]), [])

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
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 2 && <MoodView today={today} />}

        {activeTab === 3 && <MoodV2View today={today} />}

        {activeTab === 4 && (
          <SettingsView habits={habits} onClearAll={handleClearAll} />
        )}
      </section>
    </main>
  )
}

export default App
