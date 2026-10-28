import { describe, it, expect } from 'vitest'

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED'],
  APPROVED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['RETURN_PENDING_INSPECTION', 'OVERDUE', 'INCIDENT_REPORTED'],
  RETURN_PENDING_INSPECTION: ['COMPLETED', 'INCIDENT_REPORTED'],
  WAITLISTED: ['CANCELLED', 'PENDING_APPROVAL'],
  OVERDUE: ['RETURN_PENDING_INSPECTION', 'COMPLETED', 'INCIDENT_REPORTED'],
  INCIDENT_REPORTED: ['COMPLETED'],
}

function isValidTransition(fromStatus: string, toStatus: string): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false
}

describe('Booking State Transition Machine', () => {
  it('allows standard forward progression: PENDING -> APPROVED -> CHECKED_IN -> RETURN -> COMPLETED', () => {
    expect(isValidTransition('PENDING_APPROVAL', 'APPROVED')).toBe(true)
    expect(isValidTransition('APPROVED', 'CHECKED_IN')).toBe(true)
    expect(isValidTransition('CHECKED_IN', 'RETURN_PENDING_INSPECTION')).toBe(true)
    expect(isValidTransition('RETURN_PENDING_INSPECTION', 'COMPLETED')).toBe(true)
  })

  it('rejects illegal jumps or backward transitions', () => {
    expect(isValidTransition('PENDING_APPROVAL', 'COMPLETED')).toBe(false)
    expect(isValidTransition('PENDING_APPROVAL', 'CHECKED_IN')).toBe(false)
    expect(isValidTransition('COMPLETED', 'CHECKED_IN')).toBe(false)
    expect(isValidTransition('CHECKED_IN', 'APPROVED')).toBe(false)
  })

  it('allows incident reporting from active and returned states', () => {
    expect(isValidTransition('CHECKED_IN', 'INCIDENT_REPORTED')).toBe(true)
    expect(isValidTransition('RETURN_PENDING_INSPECTION', 'INCIDENT_REPORTED')).toBe(true)
  })
})
