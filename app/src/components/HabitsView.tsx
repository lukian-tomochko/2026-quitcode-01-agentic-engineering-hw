import { useState } from 'react'
import {
  PButton,
  PButtonPure,
  PIcon,
  PInlineNotification,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PTag,
  PText,
} from '@porsche-design-system/components-react'
import { ConfirmModal } from './ConfirmModal'
import { HabitFormModal } from './HabitFormModal'
import { currentStreak } from '../lib/dates'
import type { HabitDraft } from '../lib/habits'
import { HABIT_ICONS } from '../habitIcons'
import type { Habit, IsoDate } from '../types'

type Props = {
  habits: Habit[]
  /** The day App captured — shared with the grid so streaks cannot disagree. */
  today: IsoDate
  onAdd: (draft: HabitDraft) => void
  onEdit: (habitId: string, draft: HabitDraft) => void
  onDelete: (habitId: string) => void
}

const categoryLabel = (habit: Habit) =>
  HABIT_ICONS.find((option) => option.value === habit.icon)?.label ?? '—'

export function HabitsView({
  habits,
  today,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [deleting, setDeleting] = useState<Habit | null>(null)
  // Bumped on every open to remount the form with fresh fields.
  const [formKey, setFormKey] = useState(0)

  const openForm = (habit: Habit | null) => {
    setEditing(habit)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  const openCreate = () => openForm(null)
  const openEdit = (habit: Habit) => openForm(habit)

  const closeForm = () => setFormOpen(false)

  const handleSubmit = (draft: HabitDraft) => {
    if (editing) {
      onEdit(editing.id, draft)
    } else {
      onAdd(draft)
    }
    closeForm()
  }

  const handleConfirmDelete = () => {
    if (deleting) onDelete(deleting.id)
    setDeleting(null)
  }

  const deletingCheckIns = deleting?.checkIns.length ?? 0

  return (
    <>
      <div className="habits-view__toolbar">
        <PText color="contrast-medium">
          {habits.length === 1 ? '1 habit' : `${habits.length} habits`}
        </PText>
        <PButton
          type="button"
          icon="plus"
          aria={{ 'aria-haspopup': 'dialog' }}
          onClick={openCreate}
        >
          New habit
        </PButton>
      </div>

      {habits.length === 0 ? (
        <PInlineNotification
          heading="No habits yet"
          headingTag="h2"
          description="Add your first habit to start tracking it on the Overview tab."
          state="info"
          dismissButton={false}
        />
      ) : (
        <PTable caption="Your habits">
          <PTableHead>
            <PTableHeadRow>
              <PTableHeadCell>Habit</PTableHeadCell>
              <PTableHeadCell>Category</PTableHeadCell>
              <PTableHeadCell>Check-ins</PTableHeadCell>
              <PTableHeadCell>Streak</PTableHeadCell>
              <PTableHeadCell hideLabel>Actions</PTableHeadCell>
            </PTableHeadRow>
          </PTableHead>

          <PTableBody>
            {habits.map((habit) => {
              const streak = currentStreak(habit.checkIns, today)

              return (
              <PTableRow key={habit.id}>
                <PTableCell>
                  <span className="habit-name">
                    <PIcon name={habit.icon} color="contrast-high" />
                    <PText weight="semibold">{habit.name}</PText>
                  </span>
                </PTableCell>
                <PTableCell>
                  <PText color="contrast-medium">{categoryLabel(habit)}</PText>
                </PTableCell>
                <PTableCell>
                  <PText>{habit.checkIns.length}</PText>
                </PTableCell>
                <PTableCell>
                  <PTag
                    compact
                    variant={streak > 0 ? 'success' : 'secondary'}
                  >
                    {`${streak}d`}
                  </PTag>
                </PTableCell>
                <PTableCell>
                  <span className="row-actions">
                    <PButtonPure
                      type="button"
                      icon="edit"
                      hideLabel
                      aria={{ 'aria-haspopup': 'dialog' }}
                      onClick={() => openEdit(habit)}
                    >
                      {`Edit ${habit.name}`}
                    </PButtonPure>
                    <PButtonPure
                      type="button"
                      icon="delete"
                      hideLabel
                      aria={{ 'aria-haspopup': 'dialog' }}
                      onClick={() => setDeleting(habit)}
                    >
                      {`Delete ${habit.name}`}
                    </PButtonPure>
                  </span>
                </PTableCell>
              </PTableRow>
              )
            })}
          </PTableBody>
        </PTable>
      )}

      <HabitFormModal
        key={formKey}
        open={formOpen}
        habit={editing}
        habits={habits}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmModal
        open={deleting !== null}
        heading="Delete habit?"
        confirmLabel="Delete"
        confirmIcon="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleting(null)}
      >
        <PText>
          {`“${deleting?.name ?? ''}” and its ${deletingCheckIns} check-${
            deletingCheckIns === 1 ? 'in' : 'ins'
          } will be removed. This cannot be undone.`}
        </PText>
      </ConfirmModal>
    </>
  )
}
