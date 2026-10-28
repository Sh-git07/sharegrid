import { differenceInMinutes, differenceInHours, addDays, isBefore, isAfter, parseISO } from 'date-fns'
import type { Database } from './database.types'

type Resource = Database['public']['Tables']['resources']['Row']

export interface BookingValidationResult {
  valid: boolean
  error?: string
}

export function validateBookingTimes(
  resource: Resource,
  startTimeStr: string,
  endTimeStr: string
): BookingValidationResult {
  if (!startTimeStr || !endTimeStr) {
    return { valid: false, error: 'Start and end time are required' }
  }

  const start = parseISO(startTimeStr)
  const end = parseISO(endTimeStr)
  const now = new Date()

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date or time format' }
  }

  // 1. End must be strictly after start
  if (!isAfter(end, start)) {
    return { valid: false, error: 'Booking end time must be after start time' }
  }

  // 2. Start must be in the future with minimum notice
  const minNoticeHours = resource.min_notice_hours || 0
  const hoursUntilStart = differenceInHours(start, now)
  if (hoursUntilStart < minNoticeHours) {
    return {
      valid: false,
      error: `Resource requires at least ${minNoticeHours} hour${minNoticeHours > 1 ? 's' : ''} advance notice`,
    }
  }

  // 3. Max advance booking days
  const maxAdvanceDays = resource.max_advance_days || 14
  const maxDate = addDays(now, maxAdvanceDays)
  if (isAfter(start, maxDate)) {
    return {
      valid: false,
      error: `Cannot book more than ${maxAdvanceDays} days in advance`,
    }
  }

  // 4. Min / Max duration
  const durationMins = differenceInMinutes(end, start)
  if (durationMins < resource.min_duration_minutes) {
    return {
      valid: false,
      error: `Minimum duration is ${resource.min_duration_minutes} minutes`,
    }
  }
  if (durationMins > resource.max_duration_minutes) {
    return {
      valid: false,
      error: `Maximum duration is ${Math.floor(resource.max_duration_minutes / 60)} hours (${resource.max_duration_minutes} minutes)`,
    }
  }

  // 5. Operating hours check
  if (resource.operating_hours && typeof resource.operating_hours === 'object') {
    const opHours = resource.operating_hours as { days?: number[]; start?: string; end?: string }
    const dayOfWeek = start.getDay() // 0 = Sun, 1 = Mon ...
    if (opHours.days && !opHours.days.includes(dayOfWeek)) {
      return {
        valid: false,
        error: 'Resource is not available on this day of the week',
      }
    }

    if (opHours.start && opHours.end) {
      const startParts = opHours.start.split(':').map(Number)
      const endParts = opHours.end.split(':').map(Number)
      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const endMinutes = end.getHours() * 60 + end.getMinutes()
      const opStartMin = startParts[0] * 60 + startParts[1]
      const opEndMin = endParts[0] * 60 + endParts[1]

      if (startMinutes < opStartMin || endMinutes > opEndMin) {
        return {
          valid: false,
          error: `Operating hours are ${opHours.start} to ${opHours.end}`,
        }
      }
    }
  }

  return { valid: true }
}
