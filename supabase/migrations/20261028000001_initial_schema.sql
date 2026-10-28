-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. INSTITUTIONS
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  student_staff_id TEXT,
  phone TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('REQUESTER', 'RESOURCE_OWNER', 'MANAGER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'EQUIPMENT' CHECK (resource_type IN ('EQUIPMENT', 'SPACE', 'TOOL', 'VEHICLE', 'OTHER')),
  location_name TEXT NOT NULL,
  location_details TEXT, -- Private instructions/precise location, hidden from anon
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESTRICTED', 'UNAVAILABLE', 'MAINTENANCE')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_exclusive BOOLEAN NOT NULL DEFAULT true,
  min_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (min_duration_minutes > 0),
  max_duration_minutes INTEGER NOT NULL DEFAULT 480 CHECK (max_duration_minutes >= min_duration_minutes),
  buffer_minutes INTEGER NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0),
  min_notice_hours INTEGER NOT NULL DEFAULT 2 CHECK (min_notice_hours >= 0),
  max_advance_days INTEGER NOT NULL DEFAULT 14 CHECK (max_advance_days > 0),
  operating_hours JSONB NOT NULL DEFAULT '{"days": [1,2,3,4,5,6], "start": "08:00", "end": "20:00"}'::jsonb,
  rules TEXT,
  cancellation_policy TEXT,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  requires_supervision BOOLEAN NOT NULL DEFAULT false,
  max_rolling_hours_30d INTEGER NOT NULL DEFAULT 20 CHECK (max_rolling_hours_30d > 0),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RESOURCE IMAGES
CREATE TABLE IF NOT EXISTS public.resource_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RESOURCE BLACKOUT PERIODS
CREATE TABLE IF NOT EXISTS public.resource_blackout_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_time > start_time)
);

-- 8. RESOURCE REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.resource_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('TRAINING', 'QUALIFICATION', 'SUPERVISOR_APPROVAL', 'MIN_AGE', 'VERIFIED_ACCOUNT', 'DEPOSIT')),
  title TEXT NOT NULL,
  description TEXT,
  training_course_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TRAINING RECORDS
CREATE TABLE IF NOT EXISTS public.training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  certificate_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ELIGIBILITY REVIEWS
CREATE TABLE IF NOT EXISTS public.eligibility_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.resource_requirements(id) ON DELETE SET NULL,
  training_record_id UUID REFERENCES public.training_records(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'NEEDS_INFO')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  blocked_range TSTZRANGE, -- maintained via trigger
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CHECKED_IN',
    'RETURN_PENDING_INSPECTION', 'COMPLETED', 'REJECTED',
    'WAITLISTED', 'CANCELLED', 'OVERDUE', 'INCIDENT_REPORTED'
  )),
  cancellation_reason TEXT,
  notes TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Trigger to maintain blocked_range
CREATE OR REPLACE FUNCTION public.set_booking_blocked_range()
RETURNS TRIGGER AS $$
BEGIN
  NEW.blocked_range := tstzrange(
    NEW.start_time - (NEW.buffer_minutes || ' minutes')::interval,
    NEW.end_time + (NEW.buffer_minutes || ' minutes')::interval,
    '[)'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_blocked_range ON public.bookings;
CREATE TRIGGER trg_set_booking_blocked_range
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_blocked_range();

-- Exclusion constraint preventing overlapping active bookings on exclusive resources
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS exclude_overlapping_active_bookings;

ALTER TABLE public.bookings
ADD CONSTRAINT exclude_overlapping_active_bookings
EXCLUDE USING gist (
  resource_id WITH =,
  blocked_range WITH &&
)
WHERE (status IN ('APPROVED', 'CHECKED_IN', 'RETURN_PENDING_INSPECTION', 'OVERDUE', 'INCIDENT_REPORTED'));

-- 12. BOOKING DECISIONS
CREATE TABLE IF NOT EXISTS public.booking_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED', 'MORE_INFO_REQUESTED')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. WAITLIST ENTRIES
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. CONDITION REPORTS
CREATE TABLE IF NOT EXISTS public.condition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('INITIAL', 'FINAL', 'INSPECTION')),
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  has_damage BOOLEAN DEFAULT false,
  has_missing_items BOOLEAN DEFAULT false,
  lateness_minutes INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CONDITION REPORT IMAGES
CREATE TABLE IF NOT EXISTS public.condition_report_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.condition_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'DAMAGE', 'MISSING_EQUIPMENT', 'LATE_RETURN', 'SAFETY_CONCERN',
    'UNAUTHORIZED_USE', 'SCHEDULING_CONFLICT', 'OTHER'
  )),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'AWAITING_INFORMATION', 'RESOLVED', 'DISMISSED')),
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. INCIDENT UPDATES
CREATE TABLE IF NOT EXISTS public.incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('booking', 'resource', 'incident', 'verification')),
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. AUDIT LOGS (Append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  explanation TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. USAGE RECORDS
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  duration_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  is_cancelled BOOLEAN DEFAULT false,
  is_late_cancellation BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 21. INSTITUTIONAL POLICIES
CREATE TABLE IF NOT EXISTS public.institutional_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  policy_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, policy_key)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_resources_search ON public.resources USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_owner ON public.resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_resources_institution ON public.resources(institution_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status, is_published);

CREATE INDEX IF NOT EXISTS idx_bookings_resource ON public.bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requester ON public.bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_range ON public.bookings USING gist(blocked_range);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date ON public.usage_records(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_order ON public.waitlist_entries(resource_id, position ASC);

-- Public view for safe unauthenticated resource browsing (hides private location_details)
CREATE OR REPLACE VIEW public.public_resources AS
SELECT
  r.id,
  r.institution_id,
  r.owner_id,
  r.manager_id,
  r.category_id,
  r.title,
  r.description,
  r.resource_type,
  r.location_name,
  -- location_details is omitted for privacy
  r.quantity,
  r.status,
  r.is_published,
  r.is_exclusive,
  r.min_duration_minutes,
  r.max_duration_minutes,
  r.buffer_minutes,
  r.min_notice_hours,
  r.max_advance_days,
  r.operating_hours,
  r.rules,
  r.cancellation_policy,
  r.deposit_amount,
  r.requires_supervision,
  r.max_rolling_hours_30d,
  r.is_demo,
  r.created_at,
  r.updated_at,
  c.name AS category_name,
  c.icon AS category_icon,
  p.full_name AS owner_name
FROM public.resources r
LEFT JOIN public.categories c ON r.category_id = c.id
LEFT JOIN public.profiles p ON r.owner_id = p.id
WHERE r.is_published = true;
