const NOW = new Date('2026-10-07T11:00:00-07:00').getTime()

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
const fullDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dayDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
const timeOnly = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const number = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const PROTOTYPE_NOW = NOW

export function formatRelative(iso: string) {
  const diffHours = (new Date(iso).getTime() - NOW) / 36e5
  if (Math.abs(diffHours) < 24) return relative.format(Math.round(diffHours), 'hour')
  if (Math.abs(diffHours) < 24 * 7) return relative.format(Math.round(diffHours / 24), 'day')
  return shortDate.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return fullDate.format(new Date(iso))
}

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso))
}

/** A day heading, e.g. "Wednesday, Oct 7, 2026". */
export function formatDay(iso: string) {
  return dayDate.format(new Date(iso))
}

export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso))
}

export function formatNumber(value: number) {
  return number.format(value)
}

export function formatCompact(value: number) {
  return compact.format(value)
}

export function formatPercent(value: number | null) {
  return value == null ? 'N/A' : `${value.toFixed(1)}%`
}
