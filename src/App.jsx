import { useEffect, useMemo, useState } from 'react'
import * as dateHelpers from './lib/dateHelpers.js'
import * as storage from './lib/storage.js'
import * as slotEngine from './lib/slotEngine.js'
import * as constants from './constants.js'
import useKeyboardShortcuts from './lib/useKeyboardShortcuts.js'
import Sidebar from './components/Sidebar.jsx'
import DayView from './components/DayView.jsx'
import SlotModal from './components/SlotModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

export default function App() {
  const [data, setData] = useState(() => storage.load())
  const [weekKey, setWeekKey] = useState(() => dateHelpers.todayWeekKey())
  const [selectedDay, setSelectedDay] = useState(() =>
    dateHelpers.todayDayIndex(),
  )
  // modal: { mode: "create" | "edit-once" | "edit-recurring", initial?: instance }
  const [modal, setModal] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    storage.save(data)
  }, [data])

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.edt = { dateHelpers, storage, slotEngine, constants }
    }
  }, [])

  const weekInstances = useMemo(
    () => slotEngine.getSlotsForWeek(data.slots, data.exceptions, weekKey),
    [data.slots, data.exceptions, weekKey],
  )
  const instancesOfDay = useMemo(
    () => weekInstances.filter((s) => s.dayIndex === selectedDay),
    [weekInstances, selectedDay],
  )
  const checkedKeys = useMemo(
    () => new Set(data.checked?.[weekKey] || []),
    [data.checked, weekKey],
  )

  const todayWk = dateHelpers.todayWeekKey()
  const isCurrentWeek = weekKey === todayWk

  const goPrevWeek = () => {
    const monday = dateHelpers.parseWeekKey(weekKey)
    setWeekKey(dateHelpers.weekKey(dateHelpers.addDays(monday, -7)))
  }
  const goNextWeek = () => {
    const monday = dateHelpers.parseWeekKey(weekKey)
    setWeekKey(dateHelpers.weekKey(dateHelpers.addDays(monday, 7)))
  }
  const goToday = () => {
    setWeekKey(todayWk)
    setSelectedDay(dateHelpers.todayDayIndex())
  }
  const goPrevDay = () => setSelectedDay((d) => (d > 0 ? d - 1 : d))
  const goNextDay = () => setSelectedDay((d) => (d < 6 ? d + 1 : d))

  useKeyboardShortcuts({
    disabled: !!modal || settingsOpen,
    onPrevDay: goPrevDay,
    onNextDay: goNextDay,
    onPrevWeek: goPrevWeek,
    onNextWeek: goNextWeek,
    onCreate: () => setModal({ mode: 'create', initial: { dayIndex: selectedDay } }),
    onToday: goToday,
  })

  const handleToggleChecked = (instance) => {
    const key = slotEngine.instanceKey(instance)
    setData((d) => storage.toggleChecked(d, weekKey, key))
  }

  const openCreate = () =>
    setModal({ mode: 'create', initial: { dayIndex: selectedDay } })
  const openEdit = (instance) =>
    setModal({
      mode: instance.isRecurring ? 'edit-recurring' : 'edit-once',
      initial: instance,
    })
  const closeModal = () => setModal(null)

  const handleSubmitCreate = (payload) => {
    setData((d) => storage.addSlot(d, payload).data)
    if (typeof payload.dayIndex === 'number') setSelectedDay(payload.dayIndex)
    closeModal()
  }

  const handleSubmitEditAll = (payload) => {
    if (!modal?.initial) return
    setData((d) => storage.updateSlotBase(d, modal.initial.slotId, payload))
    closeModal()
  }

  const handleSubmitEditOnce = (payload) => {
    if (!modal?.initial) return
    // Override partiel : on stocke tous les champs, mais l'engine n'applique
    // que ceux fournis. Pour rester simple : on stocke tout.
    setData((d) =>
      storage.setOverride(d, modal.initial.slotId, weekKey, {
        title: payload.title,
        categoryId: payload.categoryId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        notes: payload.notes,
      }),
    )
    closeModal()
  }

  const handleDeleteAll = () => {
    if (!modal?.initial) return
    setData((d) => storage.removeSlot(d, modal.initial.slotId))
    closeModal()
  }

  const handleDeleteOnce = () => {
    if (!modal?.initial) return
    setData((d) =>
      storage.removeInstance(d, modal.initial.slotId, weekKey),
    )
    closeModal()
  }

  const handleArchiveAll = () => {
    if (!modal?.initial) return
    setData((d) => storage.toggleSlotArchived(d, modal.initial.slotId))
    closeModal()
  }

  const handleArchiveOnce = () => {
    if (!modal?.initial) return
    setData((d) =>
      storage.toggleInstanceArchived(d, modal.initial.slotId, weekKey),
    )
    closeModal()
  }

  const handleUpdateCategory = (categoryId, patch) => {
    setData((d) => storage.updateCategory(d, categoryId, patch))
  }

  const handleAddCategory = ({ label, color }) => {
    setData((d) => storage.addCategory(d, { label, color }).data)
  }

  const handleRemoveCategory = (categoryId, fallbackCategoryId) => {
    setData((d) => storage.removeCategory(d, categoryId, fallbackCategoryId))
  }

  return (
    <div className="edt-root">
      <Sidebar
        weekKey={weekKey}
        isCurrentWeek={isCurrentWeek}
        selectedDay={selectedDay}
        weekInstances={weekInstances}
        categories={data.categories}
        todayDayIndex={dateHelpers.todayDayIndex()}
        onSelectDay={setSelectedDay}
        onPrevWeek={goPrevWeek}
        onNextWeek={goNextWeek}
        onToday={goToday}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <DayView
        weekKey={weekKey}
        selectedDay={selectedDay}
        instancesOfDay={instancesOfDay}
        categories={data.categories}
        checkedKeys={checkedKeys}
        onCreateSlot={openCreate}
        onEditSlot={openEdit}
        onToggleChecked={handleToggleChecked}
      />

      <SlotModal
        open={!!modal}
        mode={modal?.mode}
        initial={modal?.initial}
        weekKey={weekKey}
        categories={data.categories}
        onClose={closeModal}
        onSubmitCreate={handleSubmitCreate}
        onSubmitEditAll={handleSubmitEditAll}
        onSubmitEditOnce={handleSubmitEditOnce}
        onDeleteAll={handleDeleteAll}
        onDeleteOnce={handleDeleteOnce}
        onToggleArchiveAll={handleArchiveAll}
        onToggleArchiveOnce={handleArchiveOnce}
      />

      <SettingsModal
        open={settingsOpen}
        categories={data.categories}
        slots={data.slots}
        onClose={() => setSettingsOpen(false)}
        onUpdateCategory={handleUpdateCategory}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
      />
    </div>
  )
}
