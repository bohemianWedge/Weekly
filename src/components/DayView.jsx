import {
  addDays,
  dayName,
  formatDayLong,
  parseWeekKey,
} from '../lib/dateHelpers.js'
import {
  dayStats,
  detectConflicts,
  instanceKey,
} from '../lib/slotEngine.js'
import SlotCard from './SlotCard.jsx'

function formatTotal(minutes) {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export default function DayView({
  weekKey,
  selectedDay,
  instancesOfDay,
  categories,
  checkedKeys,
  onCreateSlot,
  onEditSlot,
  onToggleChecked,
}) {
  const date = addDays(parseWeekKey(weekKey), selectedDay)
  const stats = dayStats(instancesOfDay)
  const conflicts = detectConflicts(instancesOfDay)
  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <main className="main">
      <div className="main-inner">
        <header className="day-header">
          <div className="day-header-text">
            <div className="day-eyebrow">{formatDayLong(date)}</div>
            <h1 className="day-title">{dayName(selectedDay)}</h1>
            <div className="day-subtitle">
              {stats.count === 0
                ? 'Aucun créneau planifié'
                : `${stats.count} créneau${stats.count > 1 ? 'x' : ''} · ${formatTotal(stats.totalMinutes)} au total`}
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={onCreateSlot}>
            + Ajouter
          </button>
        </header>

        <section className="slots">
          {instancesOfDay.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">
                Une journée libre.{' '}
                <button
                  type="button"
                  className="empty-link"
                  onClick={onCreateSlot}
                >
                  Ajouter un créneau
                </button>
                .
              </div>
              <div className="empty-hint">
                Astuce : <kbd>N</kbd> pour créer, <kbd>←</kbd> <kbd>→</kbd> pour
                naviguer
              </div>
            </div>
          ) : (
            instancesOfDay.map((inst) => {
              const key = instanceKey(inst)
              return (
                <SlotCard
                  key={key}
                  instance={inst}
                  category={categoriesById[inst.categoryId]}
                  hasConflict={conflicts.has(key)}
                  checked={checkedKeys?.has(key)}
                  onClick={() => onEditSlot && onEditSlot(inst)}
                  onToggleChecked={
                    onToggleChecked ? () => onToggleChecked(inst) : undefined
                  }
                />
              )
            })
          )}
        </section>

        <footer className="kbd-hints">
          <span>
            <kbd>N</kbd> nouveau
          </span>
          <span>
            <kbd>←</kbd> <kbd>→</kbd> jour
          </span>
          <span>
            <kbd>⇧</kbd>+<kbd>←</kbd> <kbd>→</kbd> semaine
          </span>
          <span>
            <kbd>T</kbd> aujourd'hui
          </span>
        </footer>
      </div>
    </main>
  )
}
