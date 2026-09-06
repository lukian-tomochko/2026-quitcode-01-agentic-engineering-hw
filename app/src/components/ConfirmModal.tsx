import type { ReactNode } from 'react'
import {
  PButton,
  PHeading,
  PModal,
} from '@porsche-design-system/components-react'
import type { ButtonIcon } from '@porsche-design-system/components-react'

type Props = {
  open: boolean
  heading: string
  confirmLabel: string
  confirmIcon?: ButtonIcon
  children: ReactNode
  onConfirm: () => void
  onClose: () => void
}

/** Shared dialog for the destructive actions — deleting a habit, wiping storage. */
export function ConfirmModal({
  open,
  heading,
  confirmLabel,
  confirmIcon,
  children,
  onConfirm,
  onClose,
}: Props) {
  return (
    <PModal open={open} onDismiss={onClose} aria={{ 'aria-label': heading }}>
      <PHeading slot="header" tag="h2" size="lg">
        {heading}
      </PHeading>

      {children}

      <div slot="footer" className="modal-actions">
        <PButton type="button" icon={confirmIcon} onClick={onConfirm}>
          {confirmLabel}
        </PButton>
        <PButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </PButton>
      </div>
    </PModal>
  )
}
