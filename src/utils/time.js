export function formatMealTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function parseHHMM(hhmm) {
  if (!hhmm) return -1
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatMins(totalMins) {
  const h    = Math.floor(totalMins / 60)
  const m    = totalMins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Returns a human-friendly label for the burn bar next-commitment indicator.
// < 60 min → "in 45 min"   60–119 min → "in 1 hr"   ≥ 120 min → "at 7:00 PM"
// Caller prepends the event label when minutesAway > 180 ("Dinner at 7:00 PM").
export function formatTimeUntil(minutesAway, targetHHMM) {
  if (minutesAway < 60) return `in ${minutesAway} min`
  if (minutesAway < 120) return 'in 1 hr'
  return `at ${formatMealTime(targetHHMM)}`
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false
  const d   = new Date(dateStr)
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  mon.setHours(0, 0, 0, 0)
  const nextMon = new Date(mon)
  nextMon.setDate(mon.getDate() + 7)
  return d >= mon && d < nextMon
}
