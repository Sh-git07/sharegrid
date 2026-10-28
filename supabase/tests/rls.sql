-- Supabase RLS and Conflict Constraint Verification
-- Run via: npm run test:rls or npx tsx scripts/test-rls.ts

-- 1. Verify user cannot self-assign ADMIN role
-- INSERT INTO user_roles (user_id, role) VALUES ('<requester_id>', 'ADMIN');
-- Expected: PERMISSION DENIED (violates RLS policy "Admins can manage user roles")

-- 2. Verify user cannot edit another owner's resource
-- UPDATE resources SET title = 'Hacked' WHERE owner_id != auth.uid();
-- Expected: 0 rows affected (RLS filter: owner_id = auth.uid() OR manager_id = auth.uid() OR has_role('ADMIN'))

-- 3. Verify audit_logs are append-only and immutable
-- DELETE FROM audit_logs WHERE id = '<id>';
-- UPDATE audit_logs SET explanation = 'tampered' WHERE id = '<id>';
-- Expected: PERMISSION DENIED (REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC, authenticated, anon)

-- 4. Verify isolation of private bookings
-- SELECT * FROM bookings WHERE requester_id != auth.uid() AND NOT is_resource_manager(resource_id);
-- Expected: 0 rows returned

-- 5. Exclusion constraint test
-- Two concurrent APPROVED bookings for the same resource with overlapping blocked_range [start - buffer, end + buffer)
-- Expected: EXCLUSION CONSTRAINT VIOLATION on exclude_overlapping_active_bookings
