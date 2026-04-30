import { DAYS_FR, MONTHS_FR } from '../constants.js'

// Toutes les dates manipulées ici sont des Date JS locales.
// Le "weekKey" est la date du lundi de la semaine, au format YYYY-MM-DD.

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`
}

// Renvoie une nouvelle Date à minuit local (utile pour comparer/sérialiser).
export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Lundi = 0 ... Dimanche = 6 (notre convention métier).
export function dayIndexFromDate(date) {
  const js = date.getDay() // 0 = Dimanche ... 6 = Samedi
  return (js + 6) % 7
}

// Lundi 00:00 de la semaine contenant `date`.
export function getMonday(date) {
  const d = startOfDay(date)
  return addDays(d, -dayIndexFromDate(d))
}

// "YYYY-MM-DD" du lundi de la semaine.
export function weekKey(date) {
  const m = getMonday(date)
  return `${m.getFullYear()}-${pad2(m.getMonth() + 1)}-${pad2(m.getDate())}`
}

// Parse "YYYY-MM-DD" en Date locale à minuit (sans dérive UTC).
export function parseWeekKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "27 avril 2026"
export function formatDayLong(date) {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
}

// "Lun 27"
export function formatDayShort(date) {
  return `${date.getDate()}`
}

// "27 avr."
export function formatDateShort(date) {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()].slice(0, 4)}.`
}

export function dayName(dayIndex) {
  return DAYS_FR[dayIndex]
}

// Étiquette de la semaine type "Semaine du 27 avril".
export function formatWeekLabel(weekKeyStr) {
  const monday = parseWeekKey(weekKeyStr)
  return `Semaine du ${monday.getDate()} ${MONTHS_FR[monday.getMonth()]}`
}

// "27 avr.–3 mai 2026" (ou en cas de même mois : "27–30 avril 2026")
export function formatWeekRange(weekKeyStr) {
  const monday = parseWeekKey(weekKeyStr)
  const sunday = addDays(monday, 6)
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()}–${sunday.getDate()} ${MONTHS_FR[monday.getMonth()]} ${monday.getFullYear()}`
  }
  return `${monday.getDate()} ${MONTHS_FR[monday.getMonth()].slice(0, 4)}. – ${sunday.getDate()} ${MONTHS_FR[sunday.getMonth()].slice(0, 4)}. ${sunday.getFullYear()}`
}

// "08:00" -> 480
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 480 -> "08:00"
export function minutesToTime(min) {
  const m = ((min % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
}

// Durée en minutes entre "HH:MM" et "HH:MM". Si fin <= début, on suppose 0.
export function durationMinutes(startTime, endTime) {
  const d = timeToMinutes(endTime) - timeToMinutes(startTime)
  return d > 0 ? d : 0
}

// 150 -> "2h30", 60 -> "1h", 45 -> "45min"
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${pad2(m)}`
}

// Format compact pour la sidebar : "5h00" même quand minutes=0.
export function formatHours(minutes) {
  if (!minutes || minutes <= 0) return '0h00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${pad2(m)}`
}

export function todayWeekKey() {
  return weekKey(new Date())
}

export function todayDayIndex() {
  return dayIndexFromDate(new Date())
}
