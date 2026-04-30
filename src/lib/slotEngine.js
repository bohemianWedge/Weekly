import { durationMinutes, timeToMinutes } from './dateHelpers.js'

/*
  slotEngine — logique centrale de l'app.

  Modèle :
   - Un "slot" en base (slots[]) est soit ponctuel (recurrence === "once" + weekKey),
     soit récurrent (weekly | weekdays | weekend | daily, sans weekKey).
   - exceptions[slotId][weekKey] permet de modifier (override) ou supprimer (deleted)
     l'instance d'un slot récurrent pour une semaine donnée.

  Vocabulaire :
   - "slot" = la définition stockée
   - "instance" = la projection d'un slot sur un (weekKey, dayIndex)
     C'est ce qu'on rend dans la vue. Une instance porte toujours :
       { ...données effectives, slotId, weekKey, dayIndex, isRecurring, isOverridden }
*/

// True si le slot doit apparaître sur ce dayIndex (Lun=0...Dim=6) selon sa récurrence.
export function matchesRecurrence(slot, dayIndex) {
  switch (slot.recurrence) {
    case 'daily':
      return true
    case 'weekdays':
      return dayIndex >= 0 && dayIndex <= 4
    case 'weekend':
      return dayIndex === 5 || dayIndex === 6
    case 'weekly':
      return slot.dayIndex === dayIndex
    case 'once':
      return slot.dayIndex === dayIndex
    default:
      return false
  }
}

// Construit l'objet "instance" effectif, en appliquant un éventuel override.
function buildInstance(slot, dayIndex, weekKey, override) {
  const base = {
    slotId: slot.id,
    weekKey,
    dayIndex,
    title: slot.title,
    categoryId: slot.categoryId,
    startTime: slot.startTime,
    endTime: slot.endTime,
    notes: slot.notes || '',
    recurrence: slot.recurrence,
    isRecurring: slot.recurrence !== 'once',
    isOverridden: false,
    archived: !!slot.archived,
  }
  if (!override) return base
  return {
    ...base,
    ...('title' in override ? { title: override.title } : {}),
    ...('categoryId' in override ? { categoryId: override.categoryId } : {}),
    ...('startTime' in override ? { startTime: override.startTime } : {}),
    ...('endTime' in override ? { endTime: override.endTime } : {}),
    ...('notes' in override ? { notes: override.notes } : {}),
    ...('archived' in override ? { archived: !!override.archived } : {}),
    isOverridden: true,
  }
}

// Renvoie toutes les instances d'une semaine donnée, triées par jour puis heure.
export function getSlotsForWeek(slots, exceptions, weekKey) {
  const out = []
  for (const slot of slots) {
    if (slot.recurrence === 'once') {
      if (slot.weekKey !== weekKey) continue
      if (typeof slot.dayIndex !== 'number') continue
      out.push(buildInstance(slot, slot.dayIndex, weekKey, null))
      continue
    }
    const slotEx = exceptions?.[slot.id]?.[weekKey]
    for (let day = 0; day < 7; day += 1) {
      if (!matchesRecurrence(slot, day)) continue
      // Pour weekly, dayIndex est déjà filtré par matchesRecurrence.
      // Pour weekdays/weekend/daily, on génère une instance par jour applicable.
      if (slotEx?.deleted) continue
      out.push(buildInstance(slot, day, weekKey, slotEx?.override))
    }
  }
  out.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
  return out
}

// Filtre + tri pour un seul jour.
export function getSlotsForDay(slots, exceptions, weekKey, dayIndex) {
  return getSlotsForWeek(slots, exceptions, weekKey).filter(
    (s) => s.dayIndex === dayIndex,
  )
}

// Détecte les chevauchements stricts (intervalles ouverts).
// Les instances archivées n'entrent pas en conflit.
// Retourne un Set d'identifiants d'instances en conflit (clé = slotId + dayIndex).
export function detectConflicts(instancesOfDay) {
  const conflicting = new Set()
  const sorted = [...instancesOfDay]
    .filter((s) => !s.archived)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i]
      const b = sorted[j]
      const aStart = timeToMinutes(a.startTime)
      const aEnd = timeToMinutes(a.endTime)
      const bStart = timeToMinutes(b.startTime)
      const bEnd = timeToMinutes(b.endTime)
      if (bStart >= aEnd) break // tri croissant : plus de chevauchement possible avec a
      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(instanceKey(a))
        conflicting.add(instanceKey(b))
      }
    }
  }
  return conflicting
}

// Identifiant stable d'une instance dans une vue (slotId + dayIndex suffit dans une semaine).
export function instanceKey(instance) {
  return `${instance.slotId}@${instance.dayIndex}`
}

// Stats par jour : nombre de créneaux actifs + minutes totales (archivés exclus).
export function dayStats(instancesOfDay) {
  let total = 0
  let count = 0
  for (const inst of instancesOfDay) {
    if (inst.archived) continue
    total += durationMinutes(inst.startTime, inst.endTime)
    count += 1
  }
  return { count, totalMinutes: total }
}

// Stats par catégorie sur la semaine : { [categoryId]: minutes } (archivés exclus).
export function weekStatsByCategory(instances) {
  const out = {}
  for (const inst of instances) {
    if (inst.archived) continue
    const d = durationMinutes(inst.startTime, inst.endTime)
    if (d <= 0) continue
    out[inst.categoryId] = (out[inst.categoryId] || 0) + d
  }
  return out
}

export function totalMinutes(instances) {
  let total = 0
  for (const inst of instances) {
    if (inst.archived) continue
    total += durationMinutes(inst.startTime, inst.endTime)
  }
  return total
}
