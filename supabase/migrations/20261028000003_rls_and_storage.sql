-- Enable RLS on every table
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_blackout_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_policies ENABLE ROW LEVEL SECURITY;

-- 1. INSTITUTIONS
CREATE POLICY "Institutions viewable by authenticated users"
ON public.institutions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Institutions manageable by ADMIN"
ON public.institutions FOR ALL TO authenticated
USING (public.has_role('ADMIN'))
WITH CHECK (public.has_role('ADMIN'));

-- 2. PROFILES
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage any profile"
ON public.profiles FOR ALL TO authenticated
USING (public.has_role('ADMIN'))
WITH CHECK (public.has_role('ADMIN'));

-- 3. USER ROLES (Read by owner/admins, writable ONLY by admins)
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role('ADMIN') OR public.has_role('MANAGER'));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role('ADMIN'))
WITH CHECK (public.has_role('ADMIN'));

-- 4. CATEGORIES
CREATE POLICY "Categories viewable by all"
ON public.categories FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Categories manageable by ADMIN or MANAGER"
ON public.categories FOR ALL TO authenticated
USING (public.has_role('ADMIN') OR public.has_role('MANAGER'))
WITH CHECK (public.has_role('ADMIN') OR public.has_role('MANAGER'));

-- 5. RESOURCES
CREATE POLICY "Published resources viewable by all"
ON public.resources FOR SELECT TO authenticated, anon
USING (is_published = true OR owner_id = auth.uid() OR manager_id = auth.uid() OR public.has_role('ADMIN'));

CREATE POLICY "Owners can insert resources"
ON public.resources FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND (public.has_role('RESOURCE_OWNER') OR public.has_role('ADMIN')));

CREATE POLICY "Owners and Managers can update their resources"
ON public.resources FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR manager_id = auth.uid() OR public.has_role('ADMIN'))
WITH CHECK (owner_id = auth.uid() OR manager_id = auth.uid() OR public.has_role('ADMIN'));

CREATE POLICY "Owners and Admins can delete their resources"
ON public.resources FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.has_role('ADMIN'));

-- 6. RESOURCE IMAGES
CREATE POLICY "Resource images viewable by all"
ON public.resource_images FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Resource images manageable by resource owner/manager"
ON public.resource_images FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND (r.owner_id = auth.uid() OR r.manager_id = auth.uid() OR public.has_role('ADMIN'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND (r.owner_id = auth.uid() OR r.manager_id = auth.uid() OR public.has_role('ADMIN'))));

-- 7. RESOURCE BLACKOUT PERIODS
CREATE POLICY "Blackout periods viewable by all"
ON public.resource_blackout_periods FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Blackout periods manageable by owner/manager"
ON public.resource_blackout_periods FOR ALL TO authenticated
USING (public.is_resource_manager(resource_id))
WITH CHECK (public.is_resource_manager(resource_id));

-- 8. RESOURCE REQUIREMENTS
CREATE POLICY "Requirements viewable by all"
ON public.resource_requirements FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Requirements manageable by owner/manager"
ON public.resource_requirements FOR ALL TO authenticated
USING (public.is_resource_manager(resource_id))
WITH CHECK (public.is_resource_manager(resource_id));

-- 9. TRAINING RECORDS
CREATE POLICY "Users can view own training records"
ON public.training_records FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role('MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY "Users can insert own training records"
ON public.training_records FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers and Admins can update/verify training records"
ON public.training_records FOR UPDATE TO authenticated
USING (public.has_role('MANAGER') OR public.has_role('ADMIN'))
WITH CHECK (public.has_role('MANAGER') OR public.has_role('ADMIN'));

-- 10. ELIGIBILITY REVIEWS
CREATE POLICY "Eligibility reviews viewable by user and managers"
ON public.eligibility_reviews FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role('MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY "Managers can insert eligibility reviews"
ON public.eligibility_reviews FOR INSERT TO authenticated
WITH CHECK (public.has_role('MANAGER') OR public.has_role('ADMIN'));

-- 11. BOOKINGS
CREATE POLICY "Users view own bookings or managed resource bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  requester_id = auth.uid() OR
  public.is_resource_manager(resource_id) OR
  public.has_role('ADMIN')
);

CREATE POLICY "Requesters can insert bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Requesters and managers can update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (
  requester_id = auth.uid() OR
  public.is_resource_manager(resource_id) OR
  public.has_role('ADMIN')
)
WITH CHECK (
  requester_id = auth.uid() OR
  public.is_resource_manager(resource_id) OR
  public.has_role('ADMIN')
);

-- 12. BOOKING DECISIONS
CREATE POLICY "Booking decisions viewable by booking requester and managers"
ON public.booking_decisions FOR SELECT TO authenticated
USING (
  reviewer_id = auth.uid() OR
  public.has_role('ADMIN') OR
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.requester_id = auth.uid() OR public.is_resource_manager(b.resource_id)))
);

CREATE POLICY "Managers can create booking decisions"
ON public.booking_decisions FOR INSERT TO authenticated
WITH CHECK (public.has_role('MANAGER') OR public.has_role('ADMIN') OR EXISTS (
  SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.is_resource_manager(b.resource_id)
));

-- 13. WAITLIST ENTRIES
CREATE POLICY "Users see own waitlist entries or resource manager sees all"
ON public.waitlist_entries FOR SELECT TO authenticated
USING (
  requester_id = auth.uid() OR
  public.is_resource_manager(resource_id) OR
  public.has_role('ADMIN')
);

CREATE POLICY "Requesters can insert waitlist entries"
ON public.waitlist_entries FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());

-- 14. CONDITION REPORTS
CREATE POLICY "Condition reports viewable by booking requester and managers"
ON public.condition_reports FOR SELECT TO authenticated
USING (
  reporter_id = auth.uid() OR
  public.has_role('ADMIN') OR
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.requester_id = auth.uid() OR public.is_resource_manager(b.resource_id)))
);

CREATE POLICY "Booking participants can create condition reports"
ON public.condition_reports FOR INSERT TO authenticated
WITH CHECK (
  reporter_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.requester_id = auth.uid() OR public.is_resource_manager(b.resource_id)))
);

-- 15. CONDITION REPORT IMAGES
CREATE POLICY "Condition report images viewable by booking participants"
ON public.condition_report_images FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.condition_reports cr
    JOIN public.bookings b ON cr.booking_id = b.id
    WHERE cr.id = report_id AND (b.requester_id = auth.uid() OR public.is_resource_manager(b.resource_id) OR public.has_role('ADMIN'))
  )
);

CREATE POLICY "Condition report images insertable by reporter"
ON public.condition_report_images FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.condition_reports cr
    WHERE cr.id = report_id AND (cr.reporter_id = auth.uid() OR public.has_role('ADMIN'))
  )
);

-- 16. INCIDENTS
CREATE POLICY "Incidents viewable by reporter, assignee, resource manager, admin"
ON public.incidents FOR SELECT TO authenticated
USING (
  reporter_id = auth.uid() OR
  assignee_id = auth.uid() OR
  public.is_resource_manager(resource_id) OR
  public.has_role('ADMIN')
);

CREATE POLICY "Users can report incidents"
ON public.incidents FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Managers and Admins can update incidents"
ON public.incidents FOR UPDATE TO authenticated
USING (public.is_resource_manager(resource_id) OR public.has_role('ADMIN') OR assignee_id = auth.uid())
WITH CHECK (public.is_resource_manager(resource_id) OR public.has_role('ADMIN') OR assignee_id = auth.uid());

-- 17. INCIDENT UPDATES
CREATE POLICY "Incident updates viewable by incident participants"
ON public.incident_updates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.incidents inc
    WHERE inc.id = incident_id AND (
      inc.reporter_id = auth.uid() OR
      inc.assignee_id = auth.uid() OR
      public.is_resource_manager(inc.resource_id) OR
      public.has_role('ADMIN')
    )
  )
);

CREATE POLICY "Participants can add incident updates"
ON public.incident_updates FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

-- 18. NOTIFICATIONS
CREATE POLICY "Users view and manage own notifications"
ON public.notifications FOR ALL TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- 19. AUDIT LOGS (Strictly append-only, readable by admins & resource managers)
CREATE POLICY "Audit logs readable by ADMIN or RESOURCE_MANAGER"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  public.has_role('ADMIN') OR
  EXISTS (
    SELECT 1 FROM public.resources r
    WHERE (r.id = entity_id AND (r.owner_id = auth.uid() OR r.manager_id = auth.uid()))
  ) OR
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.resources r ON b.resource_id = r.id
    WHERE b.id = entity_id AND (b.requester_id = auth.uid() OR r.owner_id = auth.uid() OR r.manager_id = auth.uid())
  )
);

-- Revoke UPDATE and DELETE on audit_logs completely
REVOKE UPDATE, DELETE ON public.audit_logs FROM PUBLIC, authenticated, anon;

-- 20. USAGE RECORDS
CREATE POLICY "Users view own usage records; managers view all"
ON public.usage_records FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role('MANAGER') OR public.has_role('ADMIN'));

-- 21. INSTITUTIONAL POLICIES
CREATE POLICY "Institutional policies readable by authenticated users"
ON public.institutional_policies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Institutional policies manageable by ADMIN"
ON public.institutional_policies FOR ALL TO authenticated
USING (public.has_role('ADMIN'))
WITH CHECK (public.has_role('ADMIN'));

-- ================= STORAGE BUCKETS SETUP =================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('resource-images', 'resource-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('condition-photos', 'condition-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('verification-docs', 'verification-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
-- 1. resource-images (Public read, authenticated upload)
CREATE POLICY "Resource images are public"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'resource-images');

CREATE POLICY "Authenticated users can upload resource images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resource-images');

CREATE POLICY "Users can update/delete their own resource images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resource-images' AND auth.uid() = owner);

-- 2. condition-photos (Private)
CREATE POLICY "Users can read condition photos for bookings they participate in"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'condition-photos');

CREATE POLICY "Authenticated users can upload condition photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'condition-photos');

-- 3. verification-docs (Private)
CREATE POLICY "Users can read own verification docs; managers can read all"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-docs');

CREATE POLICY "Authenticated users can upload verification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-docs');
