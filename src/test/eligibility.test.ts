import { describe, it, expect } from 'vitest'
import { evaluateEligibility } from '../lib/eligibility'

const mockProfile = {
  id: 'user-123',
  institution_id: 'inst-1',
  email: 'student@psit.ac.in',
  full_name: 'Aarav Sharma',
  avatar_url: null,
  department: 'Robotics',
  student_staff_id: 'UG-001',
  phone: null,
  is_demo: false,
  created_at: null,
  updated_at: null,
}

const mockResource = {
  id: 'res-3d',
  institution_id: 'inst-1',
  owner_id: 'owner-1',
  manager_id: 'mgr-1',
  category_id: 'cat-1',
  title: 'Ultimaker S5 3D Printer',
  description: 'Prototyping printer',
  resource_type: 'EQUIPMENT' as const,
  location_name: 'FabLab',
  location_details: 'Secret locker',
  quantity: 1,
  status: 'AVAILABLE' as const,
  is_published: true,
  is_exclusive: true,
  min_duration_minutes: 60,
  max_duration_minutes: 480,
  buffer_minutes: 30,
  min_notice_hours: 2,
  max_advance_days: 14,
  operating_hours: { days: [1, 2, 3, 4, 5], start: '08:00', end: '20:00' },
  rules: 'Clean bed',
  cancellation_policy: '2h notice',
  deposit_amount: 0,
  requires_supervision: false,
  max_rolling_hours_30d: 25,
  is_demo: false,
  created_at: null,
  updated_at: null,
}

const mockRequirement = {
  id: 'req-1',
  resource_id: 'res-3d',
  requirement_type: 'TRAINING' as const,
  title: '3D Printer Safety Certification',
  description: 'Must pass 3D printer safety',
  training_course_code: 'SAFE-3D-101',
  created_at: null,
}

describe('Eligibility Engine', () => {
  it('returns INELIGIBLE when required safety training is missing', () => {
    const res = evaluateEligibility(mockProfile, mockResource, [mockRequirement], [], 0)
    expect(res.eligible).toBe(false)
    expect(res.verificationStatus).toBe('INELIGIBLE')
    expect(res.missing).toHaveLength(1)
    expect(res.missing[0].title).toBe('3D Printer Safety Certification')
    expect(res.nextSteps[0]).toContain('Submit 3D Printer Safety Certification')
  })

  it('returns ELIGIBLE when verified valid training record exists', () => {
    const verifiedRecord = {
      id: 'tr-1',
      user_id: 'user-123',
      course_name: '3D Printer Safety',
      course_code: 'SAFE-3D-101',
      certificate_url: 'https://psit.ac.in/cert.pdf',
      verification_status: 'VERIFIED' as const,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 100 * 24 * 3600 * 1000).toISOString(),
      reviewer_notes: null,
      reviewer_id: 'mgr-1',
      is_demo: false,
      created_at: null,
      updated_at: null,
    }

    const res = evaluateEligibility(mockProfile, mockResource, [mockRequirement], [verifiedRecord], 5)
    expect(res.eligible).toBe(true)
    expect(res.verificationStatus).toBe('ELIGIBLE')
    expect(res.satisfied).toHaveLength(2) // Institution + Training
    expect(res.missing).toHaveLength(0)
  })

  it('returns INELIGIBLE when qualification has expired', () => {
    const expiredRecord = {
      id: 'tr-expired',
      user_id: 'user-123',
      course_name: '3D Printer Safety',
      course_code: 'SAFE-3D-101',
      certificate_url: 'https://psit.ac.in/cert.pdf',
      verification_status: 'VERIFIED' as const,
      issued_at: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // Expired 5 days ago
      reviewer_notes: null,
      reviewer_id: 'mgr-1',
      is_demo: false,
      created_at: null,
      updated_at: null,
    }

    const res = evaluateEligibility(mockProfile, mockResource, [mockRequirement], [expiredRecord], 0)
    expect(res.eligible).toBe(false)
    expect(res.verificationStatus).toBe('INELIGIBLE')
  })

  it('flags pending training verification accurately', () => {
    const pendingRecord = {
      id: 'tr-pending',
      user_id: 'user-123',
      course_name: '3D Printer Safety',
      course_code: 'SAFE-3D-101',
      certificate_url: 'https://psit.ac.in/cert.pdf',
      verification_status: 'PENDING' as const,
      issued_at: new Date().toISOString(),
      expires_at: null,
      reviewer_notes: null,
      reviewer_id: null,
      is_demo: false,
      created_at: null,
      updated_at: null,
    }

    const res = evaluateEligibility(mockProfile, mockResource, [mockRequirement], [pendingRecord], 0)
    expect(res.eligible).toBe(false)
    expect(res.missing[0].status).toBe('PENDING_REVIEW')
    expect(res.nextSteps[0]).toContain('Awaiting manager verification')
  })

  it('blocks user when rolling 30-day hours cap is exceeded', () => {
    const verifiedRecord = {
      id: 'tr-1',
      user_id: 'user-123',
      course_name: '3D Printer Safety',
      course_code: 'SAFE-3D-101',
      certificate_url: 'https://psit.ac.in/cert.pdf',
      verification_status: 'VERIFIED' as const,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 100 * 24 * 3600 * 1000).toISOString(),
      reviewer_notes: null,
      reviewer_id: null,
      is_demo: false,
      created_at: null,
      updated_at: null,
    }

    // Cap is 25 hours; user has 26 hours
    const res = evaluateEligibility(mockProfile, mockResource, [mockRequirement], [verifiedRecord], 26)
    expect(res.eligible).toBe(false)
    expect(res.missing.some((m) => m.type === 'USAGE_CAP')).toBe(true)
  })
})
