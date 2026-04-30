import { useEffect, useMemo, useRef, useState } from 'react'
import { DAYS_FR, RECURRENCE_OPTIONS } from '../constants.js'
import { timeToMinutes } from '../lib/dateHelpers.js'

const EMPTY_FORM = {
  title: '',
  categoryId: '',
  dayIndex: 0,
  startTime: '09:00',
  endTime: '10:00',
  recurrence: 'once',
  notes: '',
}

// Modes :
//  - "create"        : création d'un nouveau slot
//  - "edit-once"     : édition d'un slot ponctuel
//  - "edit-recurring": édition d'un slot récurrent (demande occ vs toutes à la sauvegarde)
export default function SlotModal({
  open,
  mode,
  initial,
  weekKey,
  categories,
  onClose,
  onSubmitCreate,
  onSubmitEditAll,
  onSubmitEditOnce,
  onDeleteAll,
  onDeleteOnce,
  onToggleArchiveAll,
  onToggleArchiveOnce,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [scopeChoice, setScopeChoice] = useState('ask')
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setError('')
    setScopeChoice('ask')
    if (mode === 'create') {
      setForm({
        ...EMPTY_FORM,
        categoryId: categories[0]?.id || '',
        dayIndex: initial?.dayIndex ?? 0,
      })
    } else if (initial) {
      setForm({
        title: initial.title || '',
        categoryId: initial.categoryId || categories[0]?.id || '',
        dayIndex: initial.dayIndex ?? 0,
        startTime: initial.startTime || '09:00',
        endTime: initial.endTime || '10:00',
        recurrence: initial.recurrence || 'once',
        notes: initial.notes || '',
      })
    }
    setTimeout(() => titleRef.current?.focus(), 30)
  }, [open, mode, initial, categories])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const validation = useMemo(() => {
    if (!form.title.trim()) return 'Donne un titre au créneau.'
    if (!form.categoryId) return 'Choisis une catégorie.'
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime))
      return "L'heure de fin doit être après l'heure de début."
    return ''
  }, [form])

  if (!open) return null

  const isEditing = mode !== 'create'
  const isEditingRecurring = mode === 'edit-recurring'
  const showScopeChoice = isEditingRecurring && scopeChoice === 'ask'

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = (e) => {
    e?.preventDefault?.()
    if (validation) {
      setError(validation)
      return
    }
    const payload = {
      title: form.title.trim(),
      categoryId: form.categoryId,
      dayIndex: Number(form.dayIndex),
      startTime: form.startTime,
      endTime: form.endTime,
      recurrence: form.recurrence,
      notes: form.notes,
      weekKey,
    }
    if (mode === 'create') {
      onSubmitCreate(payload)
      return
    }
    if (mode === 'edit-once') {
      onSubmitEditAll(payload)
      return
    }
    if (scopeChoice === 'once') {
      onSubmitEditOnce(payload)
    } else if (scopeChoice === 'all') {
      onSubmitEditAll(payload)
    } else {
      setError('Choisis le périmètre de la modification.')
    }
  }

  const onClickDelete = () => {
    if (mode === 'create') return
    if (mode === 'edit-once') {
      onDeleteAll()
      return
    }
    const choice = window.confirm(
      'Supprimer cette occurrence uniquement ?\n\n' +
        'OK → uniquement cette semaine\n' +
        'Annuler → choisir « toutes » à l\'étape suivante',
    )
    if (choice) {
      onDeleteOnce()
    } else {
      const all = window.confirm(
        'Supprimer TOUTES les occurrences de ce créneau ?',
      )
      if (all) onDeleteAll()
    }
  }

  const onClickArchive = () => {
    if (mode === 'edit-once') {
      onToggleArchiveAll()
      return
    }
    if (mode === 'edit-recurring') {
      const onlyThis = window.confirm(
        'Archiver uniquement cette occurrence ?\n\n' +
          'OK → uniquement cette semaine\n' +
          'Annuler → toutes les occurrences',
      )
      if (onlyThis) onToggleArchiveOnce()
      else onToggleArchiveAll()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? 'Nouveau créneau' : 'Modifier le créneau'}
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="form-field">
          <label htmlFor="slot-title">Titre</label>
          <input
            id="slot-title"
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Stage, footing, cours…"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="slot-category">Catégorie</label>
          <select
            id="slot-category"
            value={form.categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label htmlFor="slot-day">Jour</label>
            <select
              id="slot-day"
              value={form.dayIndex}
              onChange={(e) => update({ dayIndex: Number(e.target.value) })}
            >
              {DAYS_FR.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="slot-start">Début</label>
            <input
              id="slot-start"
              type="time"
              value={form.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="slot-end">Fin</label>
            <input
              id="slot-end"
              type="time"
              value={form.endTime}
              onChange={(e) => update({ endTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label>Récurrence</label>
          <div className="radio-group">
            {RECURRENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`radio-pill${form.recurrence === opt.value ? ' active' : ''}`}
              >
                <input
                  type="radio"
                  name="recurrence"
                  value={opt.value}
                  checked={form.recurrence === opt.value}
                  onChange={() => update({ recurrence: opt.value })}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="slot-notes">Notes</label>
          <textarea
            id="slot-notes"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={2}
            placeholder="Détails, lieu, lien…"
          />
        </div>

        {isEditingRecurring && (
          <div className="scope-inline">
            <span className="scope-inline-label">
              Appliquer la modification à
            </span>
            <div className="scope-inline-options">
              <label>
                <input
                  type="radio"
                  name="scope"
                  checked={scopeChoice === 'once'}
                  onChange={() => setScopeChoice('once')}
                />
                Cette occurrence uniquement (semaine en cours)
              </label>
              <label>
                <input
                  type="radio"
                  name="scope"
                  checked={scopeChoice === 'all'}
                  onChange={() => setScopeChoice('all')}
                />
                Toutes les occurrences
              </label>
            </div>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <div style={{ display: 'flex', gap: 8 }}>
            {isEditing && (
              <button
                type="button"
                className="btn-danger"
                onClick={onClickDelete}
              >
                Supprimer
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                className="btn-ghost"
                onClick={onClickArchive}
              >
                {initial?.archived ? 'Désarchiver' : 'Archiver'}
              </button>
            )}
          </div>
          <div className="modal-actions-right">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!!validation || showScopeChoice}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
