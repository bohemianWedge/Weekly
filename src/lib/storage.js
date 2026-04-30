import { DEFAULT_CATEGORIES, STORAGE_KEY } from '../constants.js'

// Forme attendue dans localStorage :
// { slots: [...], exceptions: { [slotId]: { [weekKey]: {deleted?, override?} } }, categories: [...] }

export function defaultData() {
  return {
    slots: [],
    exceptions: {},
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    checked: {},
  }
}

// Tolérant : si le JSON est cassé ou la clé absente, on retombe sur defaultData().
export function load() {
  if (typeof localStorage === 'undefined') return defaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    return {
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
      exceptions:
        parsed.exceptions && typeof parsed.exceptions === 'object'
          ? parsed.exceptions
          : {},
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : DEFAULT_CATEGORIES.map((c) => ({ ...c })),
      checked:
        parsed.checked && typeof parsed.checked === 'object'
          ? parsed.checked
          : {},
    }
  } catch {
    return defaultData()
  }
}

export function save(data) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearAll() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// Identifiant court mais suffisamment unique pour le MVP.
export function generateId(prefix = 's') {
  const rnd = Math.random().toString(36).slice(2, 8)
  const t = Date.now().toString(36).slice(-4)
  return `${prefix}_${t}${rnd}`
}

// --- Slots : CRUD ---

// Crée un slot. Renvoie { data, id }. `weekKey` n'est utilisé que si recurrence === "once".
export function addSlot(data, slot) {
  const id = generateId('s')
  const clean = {
    id,
    title: (slot.title || '').trim(),
    categoryId: slot.categoryId,
    dayIndex: slot.dayIndex,
    startTime: slot.startTime,
    endTime: slot.endTime,
    recurrence: slot.recurrence,
    notes: slot.notes || '',
    archived: false,
    ...(slot.recurrence === 'once' ? { weekKey: slot.weekKey } : {}),
  }
  return { data: { ...data, slots: [...data.slots, clean] }, id }
}

// Met à jour le slot en base (impacte toutes les occurrences pour un récurrent).
// `patch` peut changer la récurrence : on nettoie alors `weekKey` en conséquence
// et on purge les exceptions devenues sans objet (le slot devient ponctuel).
export function updateSlotBase(data, slotId, patch) {
  const slots = data.slots.map((s) => {
    if (s.id !== slotId) return s
    const merged = { ...s, ...patch }
    if (merged.recurrence === 'once') {
      // Garder un weekKey valide
      merged.weekKey = patch.weekKey || s.weekKey
    } else {
      delete merged.weekKey
    }
    return merged
  })
  let exceptions = data.exceptions
  const target = slots.find((s) => s.id === slotId)
  if (target && target.recurrence === 'once' && exceptions[slotId]) {
    exceptions = { ...exceptions }
    delete exceptions[slotId]
  }
  return { ...data, slots, exceptions }
}

// Pose un override pour une seule semaine d'un slot récurrent.
// `patch` ne doit contenir que des champs effectivement modifiés.
export function setOverride(data, slotId, weekKey, patch) {
  const exceptions = { ...data.exceptions }
  const forSlot = { ...(exceptions[slotId] || {}) }
  const forWeek = { ...(forSlot[weekKey] || {}) }
  forWeek.override = { ...(forWeek.override || {}), ...patch }
  forSlot[weekKey] = forWeek
  exceptions[slotId] = forSlot
  return { ...data, exceptions }
}

// Supprime totalement un slot et toutes ses exceptions.
export function removeSlot(data, slotId) {
  const exceptions = { ...data.exceptions }
  delete exceptions[slotId]
  return {
    ...data,
    slots: data.slots.filter((s) => s.id !== slotId),
    exceptions,
  }
}

// Supprime une seule occurrence d'un slot récurrent pour la semaine donnée.
export function removeInstance(data, slotId, weekKey) {
  const exceptions = { ...data.exceptions }
  const forSlot = { ...(exceptions[slotId] || {}) }
  const forWeek = { ...(forSlot[weekKey] || {}) }
  forWeek.deleted = true
  // Pas besoin de garder l'override quand on supprime
  delete forWeek.override
  forSlot[weekKey] = forWeek
  exceptions[slotId] = forSlot
  return { ...data, exceptions }
}

// --- Slots : archivage ---

// Bascule l'état archivé d'un slot ponctuel (recurrence === "once") en base.
// Pour un récurrent, on passe par toggleInstanceArchived (override par semaine).
export function toggleSlotArchived(data, slotId) {
  const next = { ...data, slots: data.slots.map((s) => ({ ...s })) }
  const slot = next.slots.find((s) => s.id === slotId)
  if (!slot) return data
  slot.archived = !slot.archived
  return next
}

// Archive/désarchive une seule occurrence d'un slot récurrent pour un weekKey donné.
// Stocké sous exceptions[slotId][weekKey].override.archived.
export function toggleInstanceArchived(data, slotId, weekKey) {
  const next = { ...data, exceptions: { ...data.exceptions } }
  const forSlot = { ...(next.exceptions[slotId] || {}) }
  const forWeek = { ...(forSlot[weekKey] || {}) }
  const override = { ...(forWeek.override || {}) }
  override.archived = !override.archived
  forWeek.override = override
  forSlot[weekKey] = forWeek
  next.exceptions[slotId] = forSlot
  return next
}

// --- État "fait/coché" (par instance, par semaine) ---

// Bascule l'état coché d'une instance dans data.checked[weekKey].
// instanceKey = "slotId@dayIndex" (cf. slotEngine.instanceKey).
export function toggleChecked(data, weekKey, instanceKey) {
  const checked = { ...(data.checked || {}) }
  const list = Array.isArray(checked[weekKey]) ? [...checked[weekKey]] : []
  const idx = list.indexOf(instanceKey)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(instanceKey)
  }
  if (list.length === 0) {
    delete checked[weekKey]
  } else {
    checked[weekKey] = list
  }
  return { ...data, checked }
}

// --- Catégories : ajout / suppression ---

export function addCategory(data, { label, color }) {
  const id = generateId('c')
  const next = {
    ...data,
    categories: [...data.categories, { id, label, color }],
  }
  return { data: next, id }
}

// Supprime une catégorie. Les slots qui la référençaient sont réassignés à
// `fallbackCategoryId` (par défaut : la première catégorie restante).
// Refuse de supprimer la dernière catégorie restante.
export function removeCategory(data, categoryId, fallbackCategoryId) {
  if (data.categories.length <= 1) return data
  const remaining = data.categories.filter((c) => c.id !== categoryId)
  if (remaining.length === data.categories.length) return data
  const fallback =
    fallbackCategoryId && remaining.some((c) => c.id === fallbackCategoryId)
      ? fallbackCategoryId
      : remaining[0].id
  return {
    ...data,
    categories: remaining,
    slots: data.slots.map((s) =>
      s.categoryId === categoryId ? { ...s, categoryId: fallback } : s,
    ),
  }
}

export function updateCategory(data, categoryId, patch) {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId ? { ...c, ...patch } : c,
    ),
  }
}
