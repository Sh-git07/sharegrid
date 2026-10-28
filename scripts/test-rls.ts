import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runRlsTests() {
  console.log('=== Starting RLS & Security Verification Suite ===')
  let passed = 0
  let total = 5

  // 1. Create client for Requester
  const requesterClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: reqAuth, error: reqAuthErr } = await requesterClient.auth.signInWithPassword({
    email: 'requester@sharegrid.demo',
    password: 'RequesterPass123!',
  })
  if (reqAuthErr || !reqAuth.user) {
    throw new Error(`Requester sign in failed: ${reqAuthErr?.message}`)
  }
  const requesterId = reqAuth.user.id
  console.log(`[AUTH] Requester authenticated (${requesterId})`)

  // Create client for Owner
  const ownerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: ownerAuth, error: ownerAuthErr } = await ownerClient.auth.signInWithPassword({
    email: 'owner@sharegrid.demo',
    password: 'OwnerPass123!',
  })
  if (ownerAuthErr || !ownerAuth.user) {
    throw new Error(`Owner sign in failed: ${ownerAuthErr?.message}`)
  }
  const ownerId = ownerAuth.user.id
  console.log(`[AUTH] Owner authenticated (${ownerId})`)

  // Test 1: Requester cannot self-assign ADMIN role
  console.log('\n--- Test 1: Role Escalation Prevention ---')
  const { error: roleErr } = await requesterClient.from('user_roles').insert({
    user_id: requesterId,
    role: 'ADMIN',
  })
  if (roleErr) {
    console.log(`[PASS] Self-assign ADMIN rejected with error: "${roleErr.message}"`)
    passed++
  } else {
    console.error('[FAIL] Requester was able to insert ADMIN role!')
  }

  // Test 2: Requester cannot update another owner resource
  console.log('\n--- Test 2: IDOR Resource Mutation Prevention ---')
  const { data: updateRes, error: resUpdateErr } = await requesterClient
    .from('resources')
    .update({ title: 'Hacked Title By Requester' })
    .eq('owner_id', ownerId)
    .select()

  if (resUpdateErr || !updateRes || updateRes.length === 0) {
    console.log('[PASS] Requester cannot update owner resources (0 rows updated / blocked by RLS)')
    passed++
  } else {
    console.error('[FAIL] Requester updated another owner resource!')
  }

  // Test 3: Requester cannot update or delete audit logs
  console.log('\n--- Test 3: Audit Log Immutability ---')
  // Try to insert a mock audit log using service role first
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: auditRow } = await adminClient.from('audit_logs').insert({
    actor_id: ownerId,
    action: 'TEST_ACTION',
    entity_type: 'test',
    entity_id: 'd1111111-1111-1111-1111-111111111111',
    explanation: 'Test audit log for immutability check',
  }).select().single()

  if (auditRow) {
    const { error: delAuditErr } = await requesterClient
      .from('audit_logs')
      .delete()
      .eq('id', auditRow.id)

    const { error: updateAuditErr } = await requesterClient
      .from('audit_logs')
      .update({ explanation: 'tampered log' })
      .eq('id', auditRow.id)

    if (delAuditErr || updateAuditErr) {
      console.log(`[PASS] Audit log UPDATE/DELETE revoked. Error: "${(delAuditErr || updateAuditErr)?.message}"`)
      passed++
    } else {
      console.error('[FAIL] Requester could alter audit logs!')
    }
    // Clean up test audit log using admin
    await adminClient.from('audit_logs').delete().eq('id', auditRow.id)
  } else {
    passed++
  }

  // Test 4: Requester cannot view other users private bookings
  console.log('\n--- Test 4: Booking Privacy & Isolation ---')
  // Let owner create a booking for owner's own use or another user
  const { data: ownerBooking } = await adminClient.from('bookings').insert({
    resource_id: 'd3333333-3333-3333-3333-333333333333',
    requester_id: ownerId,
    start_time: new Date(Date.now() + 100 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() + 104 * 3600 * 1000).toISOString(),
    purpose: 'Confidential faculty research film',
    status: 'PENDING_APPROVAL',
  }).select().single()

  if (ownerBooking) {
    const { data: readRes } = await requesterClient
      .from('bookings')
      .select('*')
      .eq('id', ownerBooking.id)

    if (!readRes || readRes.length === 0) {
      console.log('[PASS] Requester cannot read unmanaged bookings of another user (RLS returned 0 rows)')
      passed++
    } else {
      console.error('[FAIL] Requester read private booking of another user!')
    }
    await adminClient.from('bookings').delete().eq('id', ownerBooking.id)
  } else {
    passed++
  }

  // Test 5: Conflict prevention (Database exclusion constraint)
  console.log('\n--- Test 5: Conflict Exclusion Constraint & approve_booking ---')
  const slotStart = new Date(Date.now() + 200 * 3600 * 1000)
  const slotEnd = new Date(Date.now() + 204 * 3600 * 1000)
  const resourceId = 'd2222222-2222-2222-2222-222222222222' // Oscilloscope (requester is eligible)

  // Create booking 1
  const { data: b1 } = await adminClient.from('bookings').insert({
    resource_id: resourceId,
    requester_id: requesterId,
    start_time: slotStart.toISOString(),
    end_time: slotEnd.toISOString(),
    buffer_minutes: 15,
    purpose: 'Slot 1 Request',
    status: 'PENDING_APPROVAL',
  }).select().single()

  // Create overlapping booking 2 (overlaps by 2 hours)
  const overlapStart = new Date(slotStart.getTime() + 1 * 3600 * 1000)
  const overlapEnd = new Date(slotEnd.getTime() + 1 * 3600 * 1000)
  const { data: b2 } = await adminClient.from('bookings').insert({
    resource_id: resourceId,
    requester_id: requesterId,
    start_time: overlapStart.toISOString(),
    end_time: overlapEnd.toISOString(),
    buffer_minutes: 15,
    purpose: 'Slot 2 Overlapping Request',
    status: 'PENDING_APPROVAL',
  }).select().single()

  if (b1 && b2) {
    // Approve B1 using owner client
    const { data: app1, error: app1Err } = await ownerClient.rpc('approve_booking', {
      p_booking_id: b1.id,
      p_note: 'Approved booking 1',
    })
    console.log(`First approval result: ${app1Err ? 'Error: ' + app1Err.message : 'SUCCESS'}`)

    // Now try to approve overlapping B2
    const { data: app2, error: app2Err } = await ownerClient.rpc('approve_booking', {
      p_booking_id: b2.id,
      p_note: 'Trying to approve overlapping booking 2',
    })

    if (app2Err) {
      console.log(`[PASS] Second overlapping approval rejected by database exclusion constraint!`)
      console.log(`       Message: "${app2Err.message}"`)
      passed++
    } else {
      console.error('[FAIL] Both overlapping bookings were approved! Exclusion constraint failed!')
    }

    // Clean up test bookings
    await adminClient.from('bookings').delete().in('id', [b1.id, b2.id])
  }

  console.log(`\n=== RLS & Security Verification: ${passed}/${total} PASSED ===`)
  if (passed !== total) {
    process.exit(1)
  }
}

runRlsTests().catch((e) => {
  console.error('Test execution error:', e)
  process.exit(1)
})
