import {
  addDays,
  dayName,
  formatDateShort,
  formatWeekRange,
  parseWeekKey,
} from '../lib/dateHelpers.js'
import {
  dayStats,
  totalMinutes,
  weekStatsByCategory,
} from '../lib/slotEngine.js'

function formatCompactDuration(minutes) {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export default function Sidebar({
  weekKey,
  isCurrentWeek,
  selectedDay,
  weekInstances,
  categories,
  todayDayIndex,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenSettings,
}) {
  const monday = parseWeekKey(weekKey)
  const total = totalMinutes(weekInstances)
  const byCategory = weekStatsByCategory(weekInstances)
  const sortedCategories = categories
    .filter((c) => byCategory[c.id])
    .sort((a, b) => (byCategory[b.id] || 0) - (byCategory[a.id] || 0))

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark">⌘</span>
          <span className="brand-name">Hebdo</span>
        </div>
        {onOpenSettings && (
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="Paramètres"
            title="Paramètres"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>

      <div className="week-nav">
        <button
          type="button"
          className="nav-btn"
          onClick={onPrevWeek}
          aria-label="Semaine précédente"
        >
          ←
        </button>
        <div className="week-label">
          <div className="week-range">{formatWeekRange(weekKey)}</div>
          {!isCurrentWeek && (
            <button type="button" className="today-link" onClick={onToday}>
              Aujourd'hui
            </button>
          )}
        </div>
        <button
          type="button"
          className="nav-btn"
          onClick={onNextWeek}
          aria-label="Semaine suivante"
        >
          →
        </button>
      </div>

      <nav className="day-list">
        {Array.from({ length: 7 }, (_, dayIndex) => {
          const date = addDays(monday, dayIndex)
          const instancesForDay = weekInstances.filter(
            (s) => s.dayIndex === dayIndex,
          )
          const stat = dayStats(instancesForDay)
          const isSelected = selectedDay === dayIndex
          const isToday = isCurrentWeek && todayDayIndex === dayIndex
          return (
            <button
              type="button"
              key={dayIndex}
              className={`day-item${isSelected ? ' selected' : ''}`}
              onClick={() => onSelectDay(dayIndex)}
            >
              <div className="day-item-main">
                <span className="day-name">{dayName(dayIndex)}</span>
                {isToday && <span className="today-dot" aria-hidden />}
              </div>
              <div className="day-item-meta">
                <span className="day-date">{formatDateShort(date)}</span>
                <span className="day-stats">
                  {stat.count > 0
                    ? `${stat.count} · ${formatCompactDuration(stat.totalMinutes)}`
                    : '—'}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="week-summary">
        <div className="summary-header">
          <span className="summary-label">Semaine</span>
          <span className="summary-total">
            {total > 0 ? formatCompactDuration(total) : '0h'}
          </span>
        </div>
        <div className="summary-bars">
          {total === 0 ? (
            <div className="empty-summary">Aucun créneau cette semaine</div>
          ) : (
            sortedCategories.map((cat) => {
              const minutes = byCategory[cat.id] || 0
              const pct = total > 0 ? (minutes / total) * 100 : 0
              return (
                <div key={cat.id} className="bar-row">
                  <div className="bar-row-head">
                    <span className="bar-label">
                      <span
                        className="cat-dot"
                        style={{ background: cat.color }}
                      />
                      {cat.label}
                    </span>
                    <span className="bar-value">
                      {formatCompactDuration(minutes)}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
