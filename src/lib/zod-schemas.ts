import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  department: z.string().optional(),
  studentStaffId: z.string().optional(),
})

export const resourceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().min(1, 'Category is required'),
  resource_type: z.enum(['EQUIPMENT', 'SPACE', 'TOOL', 'VEHICLE', 'OTHER']),
  location_name: z.string().min(2, 'Location name is required'),
  location_details: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  status: z.enum(['AVAILABLE', 'RESTRICTED', 'UNAVAILABLE', 'MAINTENANCE']).default('AVAILABLE'),
  is_published: z.boolean().default(true),
  is_exclusive: z.boolean().default(true),
  min_duration_minutes: z.coerce.number().int().min(15).default(30),
  max_duration_minutes: z.coerce.number().int().min(15).default(480),
  buffer_minutes: z.coerce.number().int().min(0).default(15),
  min_notice_hours: z.coerce.number().int().min(0).default(2),
  max_advance_days: z.coerce.number().int().min(1).default(14),
  rules: z.string().optional(),
  cancellation_policy: z.string().optional(),
  deposit_amount: z.coerce.number().min(0).default(0),
  requires_supervision: z.boolean().default(false),
  max_rolling_hours_30d: z.coerce.number().int().min(1).default(20),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export const bookingRequestSchema = z.object({
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  purpose: z.string().min(5, 'Please provide the research or project purpose (min 5 characters)'),
  notes: z.string().optional(),
})

export const conditionReportSchema = z.object({
  notes: z.string().min(3, 'Condition notes are required'),
  has_damage: z.boolean().default(false),
  has_missing_items: z.boolean().default(false),
  checklist: z.record(z.boolean()).default({}),
  image_url: z.string().url().optional().or(z.literal('')),
})

export const incidentReportSchema = z.object({
  category: z.enum([
    'DAMAGE',
    'MISSING_EQUIPMENT',
    'LATE_RETURN',
    'SAFETY_CONCERN',
    'UNAUTHORIZED_USE',
    'SCHEDULING_CONFLICT',
    'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(10, 'Detailed incident description is required (min 10 characters)'),
  evidence_url: z.string().url().optional().or(z.literal('')),
})

export const reviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED', 'MORE_INFO_REQUESTED']),
  reason: z.string().optional(),
})
