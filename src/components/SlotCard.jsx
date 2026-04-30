import { durationMinutes, formatDuration } from '../lib/dateHelpers.js'

export default function SlotCard({
  instance,
  category,
  hasConflict,
  checked,
  onClick,
  onToggleChecked,
}) {
  const dur = durationMinutes(instance.startTime, instance.endTime)
  const isArchived = !!instance.archived
  const isChecked = !!checked
  const categoryLabel = category?.label || 'Sans catégorie'
  const categoryColor = category?.color || '#a0a0a0'

  const classes = ['slot-card']
  if (hasConflict) classes.push('has-conflict')
  if (isChecked) classes.push('is-checked')
  if (isArchived) classes.push('is-archived')

  const handleToggleClick = (e) => {
    e.stopPropagation()
    if (onToggleChecked) onToggleChecked()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick && onClick()
    }
  }

  return (
    <article
      className={classes.join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`slot-check${isChecked ? ' checked' : ''}`}
        onClick={handleToggleClick}
        aria-label={isChecked ? 'Décocher' : 'Cocher comme fait'}
        title={isChecked ? 'Décocher' : 'Marquer comme fait'}
      >
        {isChecked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L4.8 8.8L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="slot-time">
        <div className="time-start">{instance.startTime}</div>
        <div className="time-end">{instance.endTime}</div>
        <div className="time-duration">{formatDuration(dur)}</div>
      </div>

      <div className="slot-body">
        <div className="slot-meta">
          <span
            className="cat-dot"
            style={{ background: categoryColor }}
            aria-hidden
          />
          <span className="cat-label">{categoryLabel}</span>
          {instance.isRecurring && (
            <span className="recurrent-mark" title="Créneau récurrent">
              ↻ {instance.isOverridden ? 'modifié' : 'récurrent'}
            </span>
          )}
          {hasConflict && <span className="conflict-badge">⚠ Conflit</span>}
          {isChecked && <span className="done-badge">✓ Fait</span>}
          {isArchived && <span className="archived-badge">Archivé</span>}
        </div>
        <h2 className="slot-title">{instance.title}</h2>
        {instance.notes && <p className="slot-notes">{instance.notes}</p>}
      </div>
    </article>
  )
}
