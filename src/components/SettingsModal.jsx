import { useEffect, useMemo, useState } from 'react'

const PRESET_COLORS = [
  '#2d5016',
  '#8b4513',
  '#c0392b',
  '#6c5ce7',
  '#d4a017',
  '#34495e',
  '#16a085',
  '#e67e22',
  '#2980b9',
  '#8e44ad',
  '#27ae60',
  '#c2185b',
]

function pickFreeColor(categories) {
  const used = new Set(categories.map((c) => c.color.toLowerCase()))
  return PRESET_COLORS.find((c) => !used.has(c.toLowerCase())) || '#666666'
}

export default function SettingsModal({
  open,
  categories,
  slots,
  onClose,
  onUpdateCategory,
  onAddCategory,
  onRemoveCategory,
}) {
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (pendingDelete) setPendingDelete(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, pendingDelete])

  useEffect(() => {
    if (!open) setPendingDelete(null)
  }, [open])

  const usageById = useMemo(() => {
    const counts = {}
    for (const s of slots || []) {
      counts[s.categoryId] = (counts[s.categoryId] || 0) + 1
    }
    return counts
  }, [slots])

  if (!open) return null

  const canRemove = categories.length > 1

  const handleAdd = () => {
    onAddCategory({ label: 'Nouvelle catégorie', color: pickFreeColor(categories) })
  }

  const requestDelete = (cat) => {
    if (!canRemove) return
    const used = usageById[cat.id] || 0
    if (used === 0) {
      onRemoveCategory(cat.id)
    } else {
      setPendingDelete(cat)
    }
  }

  const confirmReassign = (targetId) => {
    if (!pendingDelete) return
    onRemoveCategory(pendingDelete.id, targetId)
    setPendingDelete(null)
  }

  if (pendingDelete) {
    const usage = usageById[pendingDelete.id] || 0
    const otherCats = categories.filter((c) => c.id !== pendingDelete.id)
    return (
      <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
        <div
          className="modal scope-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="modal-title">
            Supprimer « {pendingDelete.label} »
          </h2>
          <p className="scope-question">
            {usage} créneau{usage > 1 ? 'x utilisent' : ' utilise'} cette
            catégorie. Vers laquelle les déplacer ?
          </p>
          <div className="scope-options">
            {otherCats.map((c) => (
              <button
                key={c.id}
                type="button"
                className="scope-btn reassign-btn"
                onClick={() => confirmReassign(c.id)}
              >
                <span className="cat-dot" style={{ background: c.color }} />
                <span className="scope-btn-title">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPendingDelete(null)}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Catégories</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="cat-editor">
          {categories.map((cat) => {
            const used = usageById[cat.id] || 0
            return (
              <div key={cat.id} className="cat-row">
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) =>
                    onUpdateCategory(cat.id, { color: e.target.value })
                  }
                  className="color-input"
                  title="Changer la couleur"
                  aria-label={`Couleur de ${cat.label}`}
                />
                <input
                  type="text"
                  value={cat.label}
                  onChange={(e) =>
                    onUpdateCategory(cat.id, { label: e.target.value })
                  }
                  className="cat-name-input"
                  placeholder="Nom de la catégorie"
                />
                <span className="cat-row-meta">
                  {used > 0 ? `${used}` : '—'}
                </span>
                <button
                  type="button"
                  className="cat-delete-btn"
                  onClick={() => requestDelete(cat)}
                  disabled={!canRemove}
                  title={
                    canRemove
                      ? 'Supprimer'
                      : 'Au moins une catégorie est requise'
                  }
                  aria-label="Supprimer la catégorie"
                >
                  ✕
                </button>
              </div>
            )
          })}
          <button type="button" className="cat-add-btn" onClick={handleAdd}>
            + Nouvelle catégorie
          </button>
        </div>

        <div className="modal-actions">
          <div />
          <div className="modal-actions-right">
            <button type="button" className="btn-primary" onClick={onClose}>
              Terminé
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
