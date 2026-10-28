import { describe, it, expect } from 'vitest'
import { validateBookingTimes } from '../lib/booking-rules'
import { addHours, addDays, formatISO } from 'date-fns'

const sampleResource: any = {
  id: 'r1',
  min_duration_minutes: 60,
  max_duration_minutes: 360,
  min_notice_hours: 2,
  max_advance_days: 14,
  buffer_minutes: 15,
  operating_hours: {
    days: [0, 1, 2, 3, 4, 5, 6],
    start: '08:00',
    end: '20:00',
  },
}

describe('Booking Rules & Timing Engine', () => {
  it('rejects booking when end time is before start time', () => {
    const start = addHours(new Date(), 5)
    const end = addHours(new Date(), 4)
    const res = validateBookingTimes(sampleResource, formatISO(start), formatISO(end))
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Booking end time must be after start time')
  })

  it('rejects booking when advance notice is less than minimum', () => {
    // Requires min 2 hours notice; requested 30 minutes from now
    const start = addHours(new Date(), 0.5)
    const end = addHours(start, 2)
    const res = validateBookingTimes(sampleResource, formatISO(start), formatISO(end))
    expect(res.valid).toBe(false)
    expect(res.error).toContain('requires at least 2 hours advance notice')
  })

  it('rejects booking when duration is below minimum', () => {
    // Min duration is 60 mins; requested 30 mins
    const start = addHours(new Date(), 4)
    const end = addHours(start, 0.5)
    const res = validateBookingTimes(sampleResource, formatISO(start), formatISO(end))
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Minimum duration is 60 minutes')
  })

  it('rejects booking beyond max advance window', () => {
    // Max advance is 14 days; requested 20 days in advance
    const start = addDays(new Date(), 20)
    const end = addHours(start, 2)
    const res = validateBookingTimes(sampleResource, formatISO(start), formatISO(end))
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Cannot book more than 14 days in advance')
  })

  it('accepts valid requested slot within operating limits', () => {
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(10, 0, 0, 0)
    const start = tomorrow
    const end = addHours(start, 3) // 10:00 to 13:00 (within 08:00-20:00, 3 hrs duration)

    const res = validateBookingTimes(sampleResource, formatISO(start), formatISO(end))
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })
})
