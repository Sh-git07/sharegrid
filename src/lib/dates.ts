import { format, formatDistanceToNow, parseISO, isAfter, isBefore, addMinutes, differenceInMinutes, differenceInHours } from 'date-fns'

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date, fmt = 'MMM dd, yyyy hh:mm a'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return String(date)
  }
}

export function formatTime(date: string | Date, fmt = 'hh:mm a'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return String(date)
  }
}

export function formatRelative(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return String(date)
  }
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  if (remainingMins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMins}m`
}

export { isAfter, isBefore, addMinutes, differenceInMinutes, differenceInHours }
