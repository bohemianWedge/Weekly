// Constantes partagées : catégories par défaut, libellés FR, options de récurrence.

export const DAYS_FR = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]

export const DAYS_FR_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export const DEFAULT_CATEGORIES = [
  { id: 'stage', label: 'Stage / Travail', color: '#2d5016' },
  { id: 'etudes', label: 'Études', color: '#8b4513' },
  { id: 'sport', label: 'Sport', color: '#c0392b' },
  { id: 'perso', label: 'Personnel', color: '#6c5ce7' },
  { id: 'asso', label: 'Associatif', color: '#d4a017' },
  { id: 'tache', label: 'Tâche', color: '#34495e' },
]

export const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'Une fois' },
  { value: 'weekdays', label: 'Lun – Ven' },
  { value: 'weekend', label: 'Week-end' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Toutes les semaines (ce jour)' },
]

export const STORAGE_KEY = 'edt_data_v1'
