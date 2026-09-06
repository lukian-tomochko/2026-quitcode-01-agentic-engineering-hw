import { useState } from 'react'
import {
  PButton,
  PHeading,
  PInlineNotification,
  PTag,
  PText,
} from '@porsche-design-system/components-react'
import { ConfirmModal } from './ConfirmModal'
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
  const bytes = serializedSize(habits)
  const isEmpty = habits.length === 0

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
        Habits are saved in this browser only. They are not synced anywhere, and
        clearing your browser data removes them.
      </PText>

      <div className="stats-bar">
        <PTag icon="list">
          {habits.length === 1 ? '1 habit' : `${habits.length} habits`}
        </PTag>
        <PTag icon="check">{`${checkInCount} check-ins`}</PTag>
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
          {`All ${habits.length} habits and ${checkInCount} check-ins will be deleted from this browser. This cannot be undone.`}
        </PText>
      </ConfirmModal>
    </>
  )
}
