import { useState } from 'react'
import {
  PButton,
  PHeading,
  PInputText,
  PModal,
  PSelect,
  PSelectOption,
} from '@porsche-design-system/components-react'
import type { IconName } from '@porsche-design-system/components-react'
import { DEFAULT_HABIT_ICON, HABIT_ICONS } from '../habitIcons'
import { isDuplicateName, type HabitDraft } from '../lib/habits'
import type { Habit } from '../types'

const FORM_ID = 'habit-form'
const NAME_MAX_LENGTH = 40

type Props = {
  open: boolean
  /** `null` puts the form in create mode. */
  habit: Habit | null
  habits: Habit[]
  onSubmit: (draft: HabitDraft) => void
  onClose: () => void
}

export function HabitFormModal({
  open,
  habit,
  habits,
  onSubmit,
  onClose,
}: Props) {
  // Seeded once per mount. The caller remounts this modal on every open (see
  // `formKey` in HabitsView), because p-select keeps its own internal selection
  // and ignores `value` being reset from the outside — resetting via an effect
  // left the previous category showing.
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState<IconName>(habit?.icon ?? DEFAULT_HABIT_ICON)

  const trimmedName = name.trim()
  const duplicate =
    trimmedName !== '' && isDuplicateName(habits, trimmedName, habit?.id)
  // An empty name only disables the button — no error shouted at an untouched form.
  const canSubmit = trimmedName !== '' && !duplicate

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({ name: trimmedName, icon })
  }

  return (
    <PModal
      open={open}
      onDismiss={onClose}
      aria={{ 'aria-label': habit ? 'Edit habit' : 'New habit' }}
    >
      <PHeading slot="header" tag="h2" size="lg">
        {habit ? 'Edit habit' : 'New habit'}
      </PHeading>

      <form id={FORM_ID} className="habit-form" onSubmit={handleSubmit}>
        <PInputText
          name="name"
          label="Habit name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          counter
          required
          state={duplicate ? 'error' : 'none'}
          message={duplicate ? 'A habit with this name already exists.' : ''}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />

        <PSelect
          name="icon"
          label="Category"
          description="Sets the icon shown next to the habit."
          value={icon}
          onChange={(e) => setIcon(e.detail.value as IconName)}
        >
          {HABIT_ICONS.map((option) => (
            <PSelectOption key={option.value} value={option.value}>
              {option.label}
            </PSelectOption>
          ))}
        </PSelect>
      </form>

      <div slot="footer" className="modal-actions">
        <PButton type="submit" form={FORM_ID} disabled={!canSubmit}>
          {habit ? 'Save changes' : 'Add habit'}
        </PButton>
        <PButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </PButton>
      </div>
    </PModal>
  )
}
