-- Set search path for security
SET search_path = public;

-- Helper: Check user role
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check resource ownership
CREATE OR REPLACE FUNCTION public.is_resource_owner(r_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.resources
    WHERE id = r_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check resource manager/owner or admin
CREATE OR REPLACE FUNCTION public.is_resource_manager(r_id uuid)
RETURNS boolean AS $$
BEGIN
  IF public.has_role('ADMIN') OR public.has_role('MANAGER') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.resources
    WHERE id = r_id AND (owner_id = auth.uid() OR manager_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to create profile and default REQUESTER role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_inst_id UUID;
  user_full_name TEXT;
BEGIN
  -- Grab first institution if available
  SELECT id INTO default_inst_id FROM public.institutions LIMIT 1;
  
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    institution_id,
    email,
    full_name,
    avatar_url,
    is_demo
  ) VALUES (
    NEW.id,
    default_inst_id,
    NEW.email,
    user_full_name,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_demo')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Assign REQUESTER role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'REQUESTER')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Eligibility engine (Authoritative)
CREATE OR REPLACE FUNCTION public.check_eligibility(p_user_id uuid, p_resource_id uuid)
RETURNS jsonb AS $$
DECLARE
  req RECORD;
  u_profile RECORD;
  r_rec RECORD;
  t_record RECORD;
  all_satisfied jsonb := '[]'::jsonb;
  all_missing jsonb := '[]'::jsonb;
  all_expiring jsonb := '[]'::jsonb;
  all_next_steps jsonb := '[]'::jsonb;
  is_eligible boolean := true;
  has_valid_training boolean;
BEGIN
  SELECT * INTO u_profile FROM public.profiles WHERE id = p_user_id;
  SELECT * INTO r_rec FROM public.resources WHERE id = p_resource_id;

  IF u_profile IS NULL OR r_rec IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'satisfied', '[]'::jsonb,
      'missing', jsonb_build_array('User or resource not found'),
      'expiring', '[]'::jsonb,
      'nextSteps', '[]'::jsonb,
      'verificationStatus', 'INELIGIBLE'
    );
  END IF;

  -- 1. Check Institutional membership
  IF r_rec.institution_id IS NOT NULL AND u_profile.institution_id IS NOT NULL THEN
    IF r_rec.institution_id = u_profile.institution_id THEN
      all_satisfied := all_satisfied || jsonb_build_object('type', 'INSTITUTION', 'title', 'Campus Member');
    ELSE
      is_eligible := false;
      all_missing := all_missing || jsonb_build_object('type', 'INSTITUTION', 'title', 'Cross-institution sharing not enabled');
      all_next_steps := all_next_steps || 'Contact institution admin for cross-campus access authorization';
    END IF;
  END IF;

  -- 2. Check each resource requirement
  FOR req IN SELECT * FROM public.resource_requirements WHERE resource_id = p_resource_id LOOP
    IF req.requirement_type = 'TRAINING' OR req.requirement_type = 'QUALIFICATION' THEN
      has_valid_training := false;
      
      -- Check verified training records
      SELECT * INTO t_record FROM public.training_records
      WHERE user_id = p_user_id
        AND course_code = req.training_course_code
        AND verification_status = 'VERIFIED'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY issued_at DESC LIMIT 1;

      IF t_record IS NOT NULL THEN
        has_valid_training := true;
        all_satisfied := all_satisfied || jsonb_build_object(
          'type', req.requirement_type,
          'title', req.title,
          'code', req.training_course_code,
          'expires_at', t_record.expires_at
        );
        -- Expiring in next 14 days warning
        IF t_record.expires_at IS NOT NULL AND t_record.expires_at <= (now() + interval '14 days') THEN
          all_expiring := all_expiring || jsonb_build_object(
            'title', req.title,
            'expires_at', t_record.expires_at
          );
        END IF;
      ELSE
        -- Check if pending
        SELECT * INTO t_record FROM public.training_records
        WHERE user_id = p_user_id
          AND course_code = req.training_course_code
          AND verification_status = 'PENDING'
        ORDER BY created_at DESC LIMIT 1;

        is_eligible := false;
        IF t_record IS NOT NULL THEN
          all_missing := all_missing || jsonb_build_object(
            'type', req.requirement_type,
            'title', req.title || ' (Verification Pending)',
            'status', 'PENDING_REVIEW'
          );
          all_next_steps := all_next_steps || ('Awaiting manager verification for ' || req.title);
        ELSE
          all_missing := all_missing || jsonb_build_object(
            'type', req.requirement_type,
            'title', req.title,
            'status', 'MISSING',
            'course_code', req.training_course_code
          );
          all_next_steps := all_next_steps || ('Submit evidence or certificate for ' || req.title);
        END IF;
      END IF;

    ELSIF req.requirement_type = 'VERIFIED_ACCOUNT' THEN
      IF u_profile.email IS NOT NULL THEN
        all_satisfied := all_satisfied || jsonb_build_object('type', 'VERIFIED_ACCOUNT', 'title', 'Account Verified');
      ELSE
        is_eligible := false;
        all_missing := all_missing || jsonb_build_object('type', 'VERIFIED_ACCOUNT', 'title', 'Unverified Account');
        all_next_steps := all_next_steps || 'Complete profile email verification';
      END IF;

    ELSIF req.requirement_type = 'DEPOSIT' THEN
      all_satisfied := all_satisfied || jsonb_build_object('type', 'DEPOSIT', 'title', 'Security Deposit Agreed');
    END IF;
  END LOOP;

  -- 3. Check rolling 30-day usage hours cap
  DECLARE
    total_hours numeric := 0;
  BEGIN
    SELECT COALESCE(SUM(duration_hours), 0) INTO total_hours
    FROM public.usage_records
    WHERE user_id = p_user_id
      AND recorded_at >= (now() - interval '30 days')
      AND is_cancelled = false;

    IF r_rec.max_rolling_hours_30d IS NOT NULL AND total_hours >= r_rec.max_rolling_hours_30d THEN
      is_eligible := false;
      all_missing := all_missing || jsonb_build_object(
        'type', 'USAGE_CAP',
        'title', '30-Day Rolling Usage Limit Reached (' || total_hours || '/' || r_rec.max_rolling_hours_30d || ' hrs)'
      );
      all_next_steps := all_next_steps || 'Wait for previous bookings to roll off the 30-day window or request an administrative waiver';
    END IF;
  END;

  RETURN jsonb_build_object(
    'eligible', is_eligible,
    'satisfied', all_satisfied,
    'missing', all_missing,
    'expiring', all_expiring,
    'nextSteps', all_next_steps,
    'verificationStatus', CASE WHEN is_eligible THEN 'ELIGIBLE' ELSE 'INELIGIBLE' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Approve Booking Function (SECURITY DEFINER with row locking & conflict handling)
CREATE OR REPLACE FUNCTION public.approve_booking(
  p_booking_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  b_rec RECORD;
  r_rec RECORD;
  caller_id uuid := auth.uid();
  eligibility_res jsonb;
  res_title text;
BEGIN
  -- 1. Lock the booking row
  SELECT * INTO b_rec
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF b_rec IS NULL THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- Check status
  IF b_rec.status NOT IN ('PENDING_APPROVAL', 'WAITLISTED') THEN
    RAISE EXCEPTION 'Booking cannot be approved from status %', b_rec.status;
  END IF;

  -- Fetch resource
  SELECT * INTO r_rec
  FROM public.resources
  WHERE id = b_rec.resource_id;

  -- 2. Authorization check
  IF NOT (
    caller_id = r_rec.owner_id OR
    caller_id = r_rec.manager_id OR
    public.has_role('MANAGER') OR
    public.has_role('ADMIN')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the resource owner, manager, or admin can approve this booking.';
  END IF;

  -- 3. Re-verify eligibility
  eligibility_res := public.check_eligibility(b_rec.requester_id, b_rec.resource_id);
  IF (eligibility_res->>'eligible')::boolean = false THEN
    RAISE EXCEPTION 'Cannot approve: Requester is no longer eligible (%: %)', 
      jsonb_array_length(eligibility_res->'missing'),
      eligibility_res->'missing';
  END IF;

  -- 4. Try updating to APPROVED
  -- If another booking overlaps within [start-buffer, end+buffer), the exclude constraint fires!
  BEGIN
    UPDATE public.bookings
    SET
      status = 'APPROVED',
      notes = COALESCE(p_note, notes),
      updated_at = now()
    WHERE id = p_booking_id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RAISE EXCEPTION 'This time slot (including buffer) conflicts with an existing approved booking.';
  END;

  -- Record decision
  INSERT INTO public.booking_decisions (
    booking_id,
    reviewer_id,
    decision,
    reason
  ) VALUES (
    p_booking_id,
    caller_id,
    'APPROVED',
    p_note
  );

  -- Record usage hours
  INSERT INTO public.usage_records (
    user_id,
    resource_id,
    booking_id,
    category_id,
    duration_hours
  ) VALUES (
    b_rec.requester_id,
    b_rec.resource_id,
    b_rec.id,
    r_rec.category_id,
    ROUND(EXTRACT(EPOCH FROM (b_rec.end_time - b_rec.start_time)) / 3600.0, 2)
  );

  -- Create in-app notification for requester
  INSERT INTO public.notifications (
    recipient_id,
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    b_rec.requester_id,
    'Booking Approved',
    'Your reservation for ' || r_rec.title || ' from ' || 
      to_char(b_rec.start_time AT TIME ZONE 'Asia/Kolkata', 'Mon DD, HH24:MI') || ' to ' || 
      to_char(b_rec.end_time AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') || ' has been approved.',
    'BOOKING_APPROVED',
    'booking',
    b_rec.id
  );

  -- Create audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    explanation,
    before_state,
    after_state
  ) VALUES (
    caller_id,
    'APPROVE_BOOKING',
    'booking',
    p_booking_id,
    'Booking approved by resource owner/manager',
    jsonb_build_object('status', b_rec.status),
    jsonb_build_object('status', 'APPROVED', 'note', p_note)
  );

  RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'APPROVED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transition Booking Function
CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_id uuid,
  p_target_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  b_rec RECORD;
  r_rec RECORD;
  caller_id uuid := auth.uid();
  valid_transition boolean := false;
BEGIN
  SELECT * INTO b_rec FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF b_rec IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT * INTO r_rec FROM public.resources WHERE id = b_rec.resource_id;

  -- Validate state machine
  IF b_rec.status = 'PENDING_APPROVAL' AND p_target_status IN ('REJECTED', 'WAITLISTED', 'CANCELLED') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'APPROVED' AND p_target_status IN ('CHECKED_IN', 'CANCELLED') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'CHECKED_IN' AND p_target_status IN ('RETURN_PENDING_INSPECTION', 'OVERDUE', 'INCIDENT_REPORTED') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'RETURN_PENDING_INSPECTION' AND p_target_status IN ('COMPLETED', 'INCIDENT_REPORTED') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'WAITLISTED' AND p_target_status IN ('CANCELLED', 'PENDING_APPROVAL') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'OVERDUE' AND p_target_status IN ('RETURN_PENDING_INSPECTION', 'COMPLETED', 'INCIDENT_REPORTED') THEN
    valid_transition := true;
  ELSIF b_rec.status = 'INCIDENT_REPORTED' AND p_target_status IN ('COMPLETED') THEN
    valid_transition := true;
  END IF;

  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Illegal state transition from % to %', b_rec.status, p_target_status;
  END IF;

  -- Authorization check
  IF p_target_status IN ('CHECKED_IN', 'RETURN_PENDING_INSPECTION') THEN
    IF caller_id != b_rec.requester_id AND NOT (caller_id = r_rec.owner_id OR public.has_role('ADMIN')) THEN
      RAISE EXCEPTION 'Only requester or manager can check in or return this booking.';
    END IF;
  ELSIF p_target_status IN ('REJECTED', 'COMPLETED') THEN
    IF NOT (caller_id = r_rec.owner_id OR caller_id = r_rec.manager_id OR public.has_role('MANAGER') OR public.has_role('ADMIN')) THEN
      RAISE EXCEPTION 'Only owner or manager can reject or complete this booking.';
    END IF;
  ELSIF p_target_status = 'CANCELLED' THEN
    IF NOT (caller_id = b_rec.requester_id OR caller_id = r_rec.owner_id OR public.has_role('ADMIN')) THEN
      RAISE EXCEPTION 'Unauthorized to cancel this booking.';
    END IF;
  END IF;

  UPDATE public.bookings
  SET
    status = p_target_status,
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_booking_id;

  -- Record decision if rejected or waitlisted
  IF p_target_status IN ('REJECTED', 'WAITLISTED') THEN
    INSERT INTO public.booking_decisions (booking_id, reviewer_id, decision, reason)
    VALUES (p_booking_id, caller_id, p_target_status, p_notes);
  END IF;

  -- Notifications
  IF p_target_status = 'REJECTED' THEN
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (b_rec.requester_id, 'Booking Rejected', 'Your reservation for ' || r_rec.title || ' was rejected: ' || COALESCE(p_notes, 'No reason specified'), 'BOOKING_REJECTED', 'booking', b_rec.id);
  ELSIF p_target_status = 'COMPLETED' THEN
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (b_rec.requester_id, 'Booking Completed', 'Your return for ' || r_rec.title || ' has been inspected and completed. Thank you!', 'BOOKING_COMPLETED', 'booking', b_rec.id);
  ELSIF p_target_status = 'CHECKED_IN' THEN
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (r_rec.owner_id, 'Resource Checked In', b_rec.purpose || ' has been checked in for ' || r_rec.title, 'RESOURCE_CHECKED_IN', 'booking', b_rec.id);
  ELSIF p_target_status = 'RETURN_PENDING_INSPECTION' THEN
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (r_rec.owner_id, 'Return Awaiting Inspection', 'Item returned for ' || r_rec.title || '. Please inspect and confirm.', 'RETURN_PENDING_INSPECTION', 'booking', b_rec.id);
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, explanation, before_state, after_state
  ) VALUES (
    caller_id,
    'TRANSITION_BOOKING',
    'booking',
    p_booking_id,
    'Status transitioned from ' || b_rec.status || ' to ' || p_target_status,
    jsonb_build_object('status', b_rec.status),
    jsonb_build_object('status', p_target_status, 'notes', p_notes)
  );

  RETURN jsonb_build_object('success', true, 'status', p_target_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote Waitlist Function
CREATE OR REPLACE FUNCTION public.promote_waitlist(p_resource_id uuid)
RETURNS jsonb AS $$
DECLARE
  w_rec RECORD;
  r_rec RECORD;
  eligibility_res jsonb;
BEGIN
  SELECT * INTO r_rec FROM public.resources WHERE id = p_resource_id;
  
  -- Find earliest waiting entry
  SELECT * INTO w_rec
  FROM public.waitlist_entries
  WHERE resource_id = p_resource_id AND status = 'WAITING'
  ORDER BY position ASC, created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF w_rec IS NULL THEN
    RETURN jsonb_build_object('promoted', false, 'reason', 'No waitlist entries');
  END IF;

  -- Re-check eligibility
  eligibility_res := public.check_eligibility(w_rec.requester_id, p_resource_id);

  IF (eligibility_res->>'eligible')::boolean = true THEN
    -- Update waitlist entry
    UPDATE public.waitlist_entries SET status = 'PROMOTED' WHERE id = w_rec.id;
    -- Transition booking to PENDING_APPROVAL
    UPDATE public.bookings SET status = 'PENDING_APPROVAL', updated_at = now() WHERE id = w_rec.booking_id;

    -- Notify requester and owner
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (
      w_rec.requester_id,
      'Waitlist Promotion',
      'A slot freed up for ' || r_rec.title || '! Your booking has been moved to pending approval.',
      'WAITLIST_PROMOTED',
      'booking',
      w_rec.booking_id
    );

    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (
      r_rec.owner_id,
      'Waitlist Entry Promoted',
      'A waitlist request for ' || r_rec.title || ' is now ready for your review.',
      'WAITLIST_PROMOTED',
      'booking',
      w_rec.booking_id
    );

    RETURN jsonb_build_object('promoted', true, 'booking_id', w_rec.booking_id);
  ELSE
    -- Cannot safely auto-promote, notify owner
    INSERT INTO public.notifications (recipient_id, title, message, type, entity_type, entity_id)
    VALUES (
      r_rec.owner_id,
      'Waitlist Entry Ineligible',
      'A waitlisted user for ' || r_rec.title || ' is currently ineligible. Manual review required.',
      'WAITLIST_ATTENTION',
      'booking',
      w_rec.booking_id
    );

    RETURN jsonb_build_object('promoted', false, 'reason', 'Next entry ineligible');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
