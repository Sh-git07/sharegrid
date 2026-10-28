import type { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Resource = Database['public']['Tables']['resources']['Row']
type Requirement = Database['public']['Tables']['resource_requirements']['Row']
type TrainingRecord = Database['public']['Tables']['training_records']['Row']

export interface EligibilityResult {
  eligible: boolean
  satisfied: Array<{ type: string; title: string; code?: string; expires_at?: string | null }>
  missing: Array<{ type: string; title: string; course_code?: string; status?: string }>
  expiring: Array<{ title: string; expires_at: string }>
  nextSteps: string[]
  verificationStatus: 'ELIGIBLE' | 'INELIGIBLE'
}

export function evaluateEligibility(
  profile: Profile | null,
  resource: Resource,
  requirements: Requirement[],
  trainingRecords: TrainingRecord[],
  total30DayHours = 0
): EligibilityResult {
  if (!profile) {
    return {
      eligible: false,
      satisfied: [],
      missing: [{ type: 'AUTH', title: 'Sign in required' }],
      expiring: [],
      nextSteps: ['Sign in with your campus account to access this resource'],
      verificationStatus: 'INELIGIBLE',
    }
  }

  const satisfied: EligibilityResult['satisfied'] = []
  const missing: EligibilityResult['missing'] = []
  const expiring: EligibilityResult['expiring'] = []
  const nextSteps: string[] = []
  let isEligible = true

  // 1. Institution check
  if (resource.institution_id && profile.institution_id) {
    if (resource.institution_id === profile.institution_id) {
      satisfied.push({ type: 'INSTITUTION', title: 'Campus Member (PSIT)' })
    } else {
      isEligible = false
      missing.push({ type: 'INSTITUTION', title: 'Cross-institution sharing not enabled' })
      nextSteps.push('Contact institution admin for cross-campus access authorization')
    }
  }

  // 2. Resource Requirements check
  for (const req of requirements) {
    if (req.requirement_type === 'TRAINING' || req.requirement_type === 'QUALIFICATION') {
      const verifiedRecord = trainingRecords.find(
        (t) =>
          t.user_id === profile.id &&
          t.course_code === req.training_course_code &&
          t.verification_status === 'VERIFIED' &&
          (!t.expires_at || new Date(t.expires_at) > new Date())
      )

      if (verifiedRecord) {
        satisfied.push({
          type: req.requirement_type,
          title: req.title,
          code: req.training_course_code || undefined,
          expires_at: verifiedRecord.expires_at,
        })

        // Expiring in next 14 days warning
        if (verifiedRecord.expires_at) {
          const expiresDate = new Date(verifiedRecord.expires_at)
          const in14Days = new Date(Date.now() + 14 * 24 * 3600 * 1000)
          if (expiresDate <= in14Days && expiresDate > new Date()) {
            expiring.push({
              title: req.title,
              expires_at: verifiedRecord.expires_at,
            })
          }
        }
      } else {
        // Check if there is a pending record
        const pendingRecord = trainingRecords.find(
          (t) =>
            t.user_id === profile.id &&
            t.course_code === req.training_course_code &&
            t.verification_status === 'PENDING'
        )

        isEligible = false
        if (pendingRecord) {
          missing.push({
            type: req.requirement_type,
            title: `${req.title} (Verification Pending)`,
            course_code: req.training_course_code || undefined,
            status: 'PENDING_REVIEW',
          })
          nextSteps.push(`Awaiting manager verification for ${req.title}`)
        } else {
          missing.push({
            type: req.requirement_type,
            title: req.title,
            course_code: req.training_course_code || undefined,
            status: 'MISSING',
          })
          nextSteps.push(`Submit ${req.title} evidence or training completion`)
        }
      }
    } else if (req.requirement_type === 'VERIFIED_ACCOUNT') {
      if (profile.email) {
        satisfied.push({ type: 'VERIFIED_ACCOUNT', title: 'Account Verified' })
      } else {
        isEligible = false
        missing.push({ type: 'VERIFIED_ACCOUNT', title: 'Unverified Account' })
        nextSteps.push('Complete profile email verification')
      }
    } else if (req.requirement_type === 'DEPOSIT') {
      satisfied.push({ type: 'DEPOSIT', title: 'Security Deposit Terms Accepted' })
    }
  }

  // 3. Rolling 30-day usage cap
  if (resource.max_rolling_hours_30d && total30DayHours >= resource.max_rolling_hours_30d) {
    isEligible = false
    missing.push({
      type: 'USAGE_CAP',
      title: `30-Day Rolling Usage Limit Reached (${total30DayHours}/${resource.max_rolling_hours_30d} hrs)`,
    })
    nextSteps.push('Wait for older bookings to clear the 30-day rolling window')
  }

  return {
    eligible: isEligible,
    satisfied,
    missing,
    expiring,
    nextSteps,
    verificationStatus: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
  }
}
