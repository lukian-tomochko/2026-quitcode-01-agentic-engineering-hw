import {
  PButton,
  PHeading,
  PModal,
  PText,
} from '@porsche-design-system/components-react'
import type { Habit } from '../types'

type Props = {
  /** `null` keeps the modal closed. */
  habit: Habit | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Deleting drops the habit's whole check-in history, which nothing can undo
 * yet — hence the confirmation and the explicit count.
 */
export function DeleteHabitModal({ habit, onConfirm, onClose }: Props) {
  const checkInCount = habit?.checkIns.length ?? 0

  return (
    <PModal
      open={habit !== null}
      onDismiss={onClose}
      aria={{ 'aria-label': 'Delete habit' }}
    >
      <PHeading slot="header" tag="h2" size="lg">
        Delete habit?
      </PHeading>

      <PText>
        {`“${habit?.name ?? ''}” and its ${checkInCount} check-${
          checkInCount === 1 ? 'in' : 'ins'
        } will be removed. This cannot be undone.`}
      </PText>

      <div slot="footer" className="modal-actions">
        <PButton type="button" icon="delete" onClick={onConfirm}>
          Delete
        </PButton>
        <PButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </PButton>
      </div>
    </PModal>
  )
}
