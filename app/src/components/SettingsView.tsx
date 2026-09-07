import { useState } from 'react'
import {
  PButton,
  PHeading,
  PInlineNotification,
  PTag,
  PText,
} from '@porsche-design-system/components-react'
import { ConfirmModal } from './ConfirmModal'
import { loadMoods, serializedMoodSize } from '../lib/moodV2'
import { serializedSize } from '../lib/storage'
import type { Habit } from '../types'

type Props = {
  habits: Habit[]
  onClearAll: () => void
}

export function SettingsView({ habits, onClearAll }: Props) {
  const [confirming, setConfirming] = useState(false)

  const checkInCount = habits.reduce(
    (sum, habit) => sum + habit.checkIns.length,
    0,
  )

  /*
   * Mood v.2 owns its entries in its own component, so the only way to report
   * them here is to read its store. Safe to read during render: `clearMoods()`
   * runs synchronously in App's handler *before* the re-render this read
   * happens in — unlike the habit byte count, whose write lands in an effect.
   */
  const moods = loadMoods() ?? []

  const bytes = serializedSize(habits) + serializedMoodSize(moods)
  // Must consider moods too: with 0 habits but logged moods, gating on habits
  // alone hid the Clear button and made the mood history impossible to delete.
  const isEmpty = habits.length === 0 && moods.length === 0

  const handleConfirm = () => {
    onClearAll()
    setConfirming(false)
  }

  return (
    <>
      <PHeading tag="h2" size="lg">
        Stored data
      </PHeading>

      <PText color="contrast-medium">
        Habits and Mood v.2 entries are saved in this browser only. They are not
        synced anywhere, and clearing your browser data removes them.
      </PText>

      <div className="stats-bar">
        <PTag icon="list">
          {habits.length === 1 ? '1 habit' : `${habits.length} habits`}
        </PTag>
        <PTag icon="check">{`${checkInCount} check-ins`}</PTag>
        <PTag icon="heart">
          {moods.length === 1 ? '1 mood entry' : `${moods.length} mood entries`}
        </PTag>
        <PTag icon="save">{`${bytes} bytes`}</PTag>
      </div>

      {isEmpty ? (
        <PInlineNotification
          heading="Nothing stored"
          headingTag="h3"
          description="There is no saved data to clear."
          state="info"
          dismissButton={false}
        />
      ) : (
        <div className="settings__actions">
          <PButton
            type="button"
            icon="delete"
            variant="secondary"
            aria={{ 'aria-haspopup': 'dialog' }}
            onClick={() => setConfirming(true)}
          >
            Clear all data
          </PButton>
        </div>
      )}

      <ConfirmModal
        open={confirming}
        heading="Clear all data?"
        confirmLabel="Clear everything"
        confirmIcon="delete"
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      >
        <PText>
          {`All ${habits.length} habits, ${checkInCount} check-ins and ${moods.length} Mood v.2 entries will be deleted from this browser. This cannot be undone.`}
        </PText>
      </ConfirmModal>
    </>
  )
}
