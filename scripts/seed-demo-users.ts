import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const INSTITUTION_ID = '11111111-1111-1111-1111-111111111111'

const DEMO_USERS = [
  {
    email: 'requester@sharegrid.demo',
    password: 'RequesterPass123!',
    fullName: 'Aarav Sharma',
    department: 'Robotics & Mechatronics',
    studentId: 'PSIT-2024-UG-042',
    roles: ['REQUESTER'],
  },
  {
    email: 'owner@sharegrid.demo',
    password: 'OwnerPass123!',
    fullName: 'Dr. Neha Patel',
    department: 'Advanced Manufacturing Lab',
    studentId: 'PSIT-FAC-019',
    roles: ['RESOURCE_OWNER', 'REQUESTER'],
  },
  {
    email: 'manager@sharegrid.demo',
    password: 'ManagerPass123!',
    fullName: 'Prof. Rajesh Verma',
    department: 'Central Instrumentation Facility',
    studentId: 'PSIT-MGR-007',
    roles: ['MANAGER', 'REQUESTER'],
  },
  {
    email: 'admin@sharegrid.demo',
    password: 'AdminPass123!',
    fullName: 'Pooja Deshmukh (Admin)',
    department: 'Academic & Research Operations',
    studentId: 'PSIT-ADM-001',
    roles: ['ADMIN', 'REQUESTER'],
  },
]

async function seed() {
  console.log('--- Starting Demo Seeding Script ---')

  // 1. Ensure institution exists
  const { error: instErr } = await adminClient.from('institutions').upsert({
    id: INSTITUTION_ID,
    name: 'Pranveer Singh Institute of Technology',
    slug: 'psit',
    domain: 'psit.ac.in',
    is_demo: true,
  })
  if (instErr) {
    console.error('Error inserting institution:', instErr.message)
  } else {
    console.log('[OK] Institution PSIT verified')
  }

  // 2. Ensure categories
  const categories = [
    { id: 'c1111111-1111-1111-1111-111111111111', name: 'Rapid Prototyping & 3D Printing', slug: '3d-printing', description: 'Industrial & desktop additive manufacturing, filaments, and SLA/FDM printers', icon: 'Printer' },
    { id: 'c2222222-2222-2222-2222-222222222222', name: 'Electronics & Instrumentation', slug: 'electronics', description: 'Oscilloscopes, logic analyzers, function generators, and soldering stations', icon: 'Cpu' },
    { id: 'c3333333-3333-3333-3333-333333333333', name: 'Media & Audio-Visual Kit', slug: 'media-kit', description: 'Cinema-grade mirrorless cameras, field audio recorders, studio lighting', icon: 'Camera' },
    { id: 'c4444444-4444-4444-4444-444444444444', name: 'High-Performance Computing', slug: 'computing', description: 'GPU deep learning rigs, simulation servers, and cluster nodes', icon: 'Server' },
    { id: 'c5555555-5555-5555-5555-555555555555', name: 'Precision Workshops & CNC', slug: 'cnc-workshops', description: 'Computer numerical control mills, precision lathes, and sheet metal benders', icon: 'Wrench' },
    { id: 'c6666666-6666-6666-6666-666666666666', name: 'Seminar & Research Spaces', slug: 'spaces', description: 'Acoustic seminar rooms, collaborative meeting zones, lecture recording suites', icon: 'Building' },
  ]
  for (const cat of categories) {
    await adminClient.from('categories').upsert({ ...cat, institution_id: INSTITUTION_ID })
  }
  console.log('[OK] Categories verified')

  // 3. Create or update Demo Auth Users
  const userMap = new Map<string, string>() // email -> uid

  for (const u of DEMO_USERS) {
    const { data: listData } = await adminClient.auth.admin.listUsers()
    const existing = listData?.users.find((x) => x.email === u.email)
    let uid = existing?.id

    if (!existing) {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          is_demo: true,
        },
      })
      if (createErr || !newUser.user) {
        console.error(`Failed to create user ${u.email}:`, createErr?.message)
        continue
      }
      uid = newUser.user.id
      console.log(`[CREATED] User: ${u.email} (${uid})`)
    } else {
      // update password to ensure it matches documented credentials
      await adminClient.auth.admin.updateUserById(existing.id, {
        password: u.password,
        user_metadata: { full_name: u.fullName, is_demo: true },
      })
      console.log(`[EXISTS] User: ${u.email} (${uid})`)
    }

    userMap.set(u.email, uid!)

    // Upsert profile
    await adminClient.from('profiles').upsert({
      id: uid,
      institution_id: INSTITUTION_ID,
      email: u.email,
      full_name: u.fullName,
      department: u.department,
      student_staff_id: u.studentId,
      is_demo: true,
    })

    // Upsert roles
    for (const r of u.roles) {
      await adminClient.from('user_roles').upsert(
        { user_id: uid, role: r },
        { onConflict: 'user_id,role' }
      )
    }
  }

  const requesterId = userMap.get('requester@sharegrid.demo')!
  const ownerId = userMap.get('owner@sharegrid.demo')!
  const managerId = userMap.get('manager@sharegrid.demo')!
  const adminId = userMap.get('admin@sharegrid.demo')!

  // 4. Seed Resources
  const resourcesToSeed = [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c1111111-1111-1111-1111-111111111111',
      title: 'Ultimaker S5 Dual-Extrusion 3D Printer',
      description: 'Dual-extrusion composite-ready 3D printer featuring active bed leveling, 330 x 240 x 300 mm build volume, and soluble PVA support capability for intricate architectural and mechanical models.',
      resource_type: 'EQUIPMENT',
      location_name: 'FabLab Room 204, Mechanical Engineering Block',
      location_details: 'Enter through north corridor, keycode #4291 for door; keycard required after 6 PM.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 60,
      max_duration_minutes: 480,
      buffer_minutes: 30,
      min_notice_hours: 2,
      max_advance_days: 14,
      rules: 'Use only approved PLA/PETG filaments. Clean nozzle post-print. Wear protective gloves when removing prints.',
      cancellation_policy: 'Free cancellation up to 2 hours before scheduled slot.',
      deposit_amount: 0,
      requires_supervision: false,
      max_rolling_hours_30d: 25,
      is_demo: true,
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c2222222-2222-2222-2222-222222222222',
      title: 'Rigol DS1054Z 4-Channel Mixed Signal Lab Station',
      description: '50 MHz 4-channel digital oscilloscope bundled with Hakko FX-888D soldering station, Rigol DP832 DC power supply, and anti-static ESD workbench.',
      resource_type: 'EQUIPMENT',
      location_name: 'Hardware Design Lab, Room 112',
      location_details: 'Bench 4, near the spectrum analyzer rack.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 30,
      max_duration_minutes: 360,
      buffer_minutes: 15,
      min_notice_hours: 1,
      max_advance_days: 10,
      rules: 'ESD wrist strap mandatory. Power down stations before leaving.',
      cancellation_policy: 'Cancel up to 1 hour prior.',
      deposit_amount: 0,
      requires_supervision: false,
      max_rolling_hours_30d: 30,
      is_demo: true,
    },
    {
      id: 'd3333333-3333-3333-3333-333333333333',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Sony Alpha A7 IV Cinema & Photo Kit',
      description: '33MP full-frame hybrid camera with 24-70mm f/2.8 GM lens, DJI Ronin RS3 gimbal, Rode Wireless GO II microphone set, and Pelican waterproof protective case.',
      resource_type: 'EQUIPMENT',
      location_name: 'Media Center Equipment Locker, Floor 1',
      location_details: 'Sign out at desk with Mr. Anand; locker code provided after handover check-in.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 120,
      max_duration_minutes: 720,
      buffer_minutes: 60,
      min_notice_hours: 4,
      max_advance_days: 7,
      rules: 'Inspect lens glass upon receiving. Do not expose to heavy rain without weather housing.',
      cancellation_policy: 'Cancel 4 hours prior.',
      deposit_amount: 50,
      requires_supervision: false,
      max_rolling_hours_30d: 20,
      is_demo: true,
    },
    {
      id: 'd4444444-4444-4444-4444-444444444444',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c4444444-4444-4444-4444-444444444444',
      title: 'NVIDIA RTX 4090 Deep Learning Rig (24GB VRAM)',
      description: 'Dedicated machine learning workstation with AMD Ryzen 7950X, 128GB DDR5 RAM, dual Gen4 NVMe, and PyTorch / CUDA 12.2 environment preloaded.',
      resource_type: 'EQUIPMENT',
      location_name: 'AI Research Cluster, Room 408',
      location_details: 'Node DL-NODE-03; SSH credentials dispatched on check-in.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 60,
      max_duration_minutes: 1440,
      buffer_minutes: 15,
      min_notice_hours: 2,
      max_advance_days: 14,
      rules: 'Export dataset artifacts before end of booking; local drive temp folders are cleared automatically.',
      cancellation_policy: 'Cancel 2 hours prior.',
      deposit_amount: 0,
      requires_supervision: false,
      max_rolling_hours_30d: 40,
      is_demo: true,
    },
    {
      id: 'd5555555-5555-5555-5555-555555555555',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c5555555-5555-5555-5555-555555555555',
      title: 'Haas Desktop CNC Mill (Supervised)',
      description: '3-axis desktop CNC milling machine with 15k RPM spindle for aluminum, brass, and composite tooling. Supervised operation only.',
      resource_type: 'EQUIPMENT',
      location_name: 'Precision Machining Workshop, Bay 2',
      location_details: 'Workshop supervisor presence mandatory during all spindle run time.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 60,
      max_duration_minutes: 240,
      buffer_minutes: 45,
      min_notice_hours: 24,
      max_advance_days: 14,
      rules: 'Safety glasses and steel-toe boots mandatory. CNC CAM simulation approval required prior to cut.',
      cancellation_policy: 'Cancel 12 hours prior.',
      deposit_amount: 0,
      requires_supervision: true,
      max_rolling_hours_30d: 15,
      is_demo: true,
    },
    {
      id: 'd6666666-6666-6666-6666-666666666666',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c6666666-6666-6666-6666-666666666666',
      title: 'Auditorium Hall B Research Presentation Space',
      description: 'Acoustically treated 80-seat presentation room with dual laser projection, wireless lapel microphones, Zoom Rooms integration, and motorized projection screen.',
      resource_type: 'SPACE',
      location_name: 'Auditorium Complex, Ground Floor',
      location_details: 'AV technician desk located in booth rear.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 60,
      max_duration_minutes: 480,
      buffer_minutes: 30,
      min_notice_hours: 12,
      max_advance_days: 30,
      rules: 'No food or unsealed beverages allowed. AV technician must confirm shutdown.',
      cancellation_policy: 'Cancel 24 hours prior.',
      deposit_amount: 0,
      requires_supervision: false,
      max_rolling_hours_30d: 20,
      is_demo: true,
    },
    {
      id: 'd7777777-7777-7777-7777-777777777777',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c2222222-2222-2222-2222-222222222222',
      title: 'Microfabrication Cleanroom Station (Class 1000)',
      description: 'Laminar flow hood station equipped with spin coater, ultraviolet mask aligner, and optical surface profilometer for thin-film semiconductor prototyping.',
      resource_type: 'SPACE',
      location_name: 'Nano-Fabrication Facility, Cleanroom B',
      location_details: 'Gowning room airlock access with certified badge only.',
      quantity: 1,
      status: 'RESTRICTED',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 90,
      max_duration_minutes: 300,
      buffer_minutes: 45,
      min_notice_hours: 24,
      max_advance_days: 14,
      rules: 'Full cleanroom bunny suit and nitrile gloves required. Follow chemical disposal protocol strictly.',
      cancellation_policy: 'Cancel 12 hours prior.',
      deposit_amount: 0,
      requires_supervision: true,
      max_rolling_hours_30d: 15,
      is_demo: true,
    },
    {
      id: 'd8888888-8888-8888-8888-888888888888',
      institution_id: INSTITUTION_ID,
      owner_id: ownerId,
      manager_id: managerId,
      category_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Epson 4K Laser Projector & Portable Bose Sound Kit',
      description: '12,000 lumens high-brightness 4K projection rig with folding 150-inch truss screen and twin Bose S1 Pro+ wireless PA speakers with stands.',
      resource_type: 'EQUIPMENT',
      location_name: 'Campus Event Dispatch Office, Room 102',
      location_details: 'Dispatch desk; cable bag and remote control inside locked case.',
      quantity: 1,
      status: 'AVAILABLE',
      is_published: true,
      is_exclusive: true,
      min_duration_minutes: 60,
      max_duration_minutes: 360,
      buffer_minutes: 30,
      min_notice_hours: 4,
      max_advance_days: 14,
      rules: 'Ensure projector laser cool-down cycle is completed before packing.',
      cancellation_policy: 'Cancel 4 hours prior.',
      deposit_amount: 0,
      requires_supervision: false,
      max_rolling_hours_30d: 25,
      is_demo: true,
    },
  ]

  for (const r of resourcesToSeed) {
    await adminClient.from('resources').upsert(r)
  }
  console.log('[OK] Resources seeded')

  // 5. Seed Resource Images
  const resourceImages = [
    { resource_id: 'd1111111-1111-1111-1111-111111111111', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', caption: 'Ultimaker S5 dual-extrusion 3D printer running continuous print', is_primary: true },
    { resource_id: 'd2222222-2222-2222-2222-222222222222', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80', caption: 'Electronics bench with digital oscilloscope and power supplies', is_primary: true },
    { resource_id: 'd3333333-3333-3333-3333-333333333333', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', caption: 'Sony Alpha hybrid cinema body with GM lens kit', is_primary: true },
    { resource_id: 'd4444444-4444-4444-4444-444444444444', url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80', caption: 'Liquid-cooled dual GPU workstation interior', is_primary: true },
    { resource_id: 'd5555555-5555-5555-5555-555555555555', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80', caption: 'Precision desktop CNC milling bay', is_primary: true },
    { resource_id: 'd6666666-6666-6666-6666-666666666666', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', caption: 'Auditorium Hall B with widescreen presentation displays', is_primary: true },
    { resource_id: 'd7777777-7777-7777-7777-777777777777', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Cleanroom laminar flow workbench', is_primary: true },
    { resource_id: 'd8888888-8888-8888-8888-888888888888', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80', caption: 'Portable high-lumen 4K projection rig', is_primary: true },
  ]
  for (const img of resourceImages) {
    await adminClient.from('resource_images').upsert(img, { onConflict: 'resource_id,url' })
  }
  console.log('[OK] Resource images seeded')

  // 6. Seed Requirements
  // Ultimaker requires SAFE-3D-101
  await adminClient.from('resource_requirements').upsert({
    id: 'req11111-1111-1111-1111-111111111111',
    resource_id: 'd1111111-1111-1111-1111-111111111111',
    requirement_type: 'TRAINING',
    title: '3D Printer Safety & Operation Certification',
    description: 'Completion of 3D printer safety, fire prevention, and slicer temperature setup module.',
    training_course_code: 'SAFE-3D-101',
  })

  // Oscilloscope requires ELEC-201
  await adminClient.from('resource_requirements').upsert({
    id: 'req22222-2222-2222-2222-222222222222',
    resource_id: 'd2222222-2222-2222-2222-222222222222',
    requirement_type: 'TRAINING',
    title: 'Basic Electronics & Soldering Safety',
    description: 'ESD compliance and high-temp iron safety protocol certification.',
    training_course_code: 'ELEC-201',
  })

  // Haas CNC requires CNC-SAFE-301
  await adminClient.from('resource_requirements').upsert({
    id: 'req55555-5555-5555-5555-555555555555',
    resource_id: 'd5555555-5555-5555-5555-555555555555',
    requirement_type: 'QUALIFICATION',
    title: 'Precision CNC Machining Safety License',
    description: 'Machining safety, tool zeroing, emergency stop protocol, and coolant management.',
    training_course_code: 'CNC-SAFE-301',
  })
  console.log('[OK] Resource requirements seeded')

  // 7. Seed Sample Training Records for Requester
  // - ELEC-201: Verified and valid
  // - CNC-SAFE-301: Expired qualification
  // (Notice: SAFE-3D-101 is NOT verified yet, so requester can submit in demo scenario!)
  await adminClient.from('training_records').upsert([
    {
      id: 't1111111-1111-1111-1111-111111111111',
      user_id: requesterId,
      course_name: 'Basic Electronics & Soldering Safety',
      course_code: 'ELEC-201',
      certificate_url: 'https://sharegrid.demo/certs/elec-201-verified.pdf',
      verification_status: 'VERIFIED',
      issued_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      reviewer_notes: 'Passed laboratory safety assessment with 96% score.',
      reviewer_id: managerId,
      is_demo: true,
    },
    {
      id: 't2222222-2222-2222-2222-222222222222',
      user_id: requesterId,
      course_name: 'Precision CNC Machining Safety License',
      course_code: 'CNC-SAFE-301',
      certificate_url: 'https://sharegrid.demo/certs/cnc-safe-expired.pdf',
      verification_status: 'VERIFIED',
      issued_at: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // Expired 10 days ago!
      reviewer_notes: 'Annual renewal required. Machine hours expired.',
      reviewer_id: managerId,
      is_demo: true,
    },
  ])
  console.log('[OK] Sample training records seeded (ELEC-201 active, CNC-SAFE-301 expired)')

  // 8. Seed Sample Historical Bookings
  // A completed booking for Oscilloscope
  const pastStart = new Date(Date.now() - 72 * 3600 * 1000)
  const pastEnd = new Date(Date.now() - 68 * 3600 * 1000)

  const { data: pastBooking } = await adminClient.from('bookings').upsert({
    id: 'b1111111-1111-1111-1111-111111111111',
    resource_id: 'd2222222-2222-2222-2222-222222222222',
    requester_id: requesterId,
    start_time: pastStart.toISOString(),
    end_time: pastEnd.toISOString(),
    buffer_minutes: 15,
    purpose: 'Senior design capstone PCB debugging and signal jitter analysis',
    status: 'COMPLETED',
    notes: 'Completed without issues. Workstation left clean.',
    is_demo: true,
  }).select().single()

  if (pastBooking) {
    // Condition reports
    await adminClient.from('condition_reports').upsert([
      {
        id: 'cr111111-1111-1111-1111-111111111111',
        booking_id: pastBooking.id,
        reporter_id: requesterId,
        phase: 'INITIAL',
        checklist: { power_cables_present: true, screen_clear: true, probes_calibrated: true },
        notes: 'Station in excellent condition upon start.',
        is_demo: true,
      },
      {
        id: 'cr222222-2222-2222-2222-222222222222',
        booking_id: pastBooking.id,
        reporter_id: requesterId,
        phase: 'FINAL',
        checklist: { power_cables_present: true, screen_clear: true, probes_stored: true, power_off: true },
        notes: 'Powered down and all 4 probes returned to rack.',
        is_demo: true,
      },
    ])

    // Usage record
    await adminClient.from('usage_records').upsert({
      user_id: requesterId,
      resource_id: 'd2222222-2222-2222-2222-222222222222',
      booking_id: pastBooking.id,
      category_id: 'c2222222-2222-2222-2222-222222222222',
      duration_hours: 4.0,
      recorded_at: pastStart.toISOString(),
    })
  }

  // 9. Seed One Waitlisted Booking & Entry
  const futureStart = new Date(Date.now() + 48 * 3600 * 1000)
  const futureEnd = new Date(Date.now() + 52 * 3600 * 1000)

  const { data: waitlistBooking } = await adminClient.from('bookings').upsert({
    id: 'b2222222-2222-2222-2222-222222222222',
    resource_id: 'd4444444-4444-4444-4444-444444444444',
    requester_id: requesterId,
    start_time: futureStart.toISOString(),
    end_time: futureEnd.toISOString(),
    buffer_minutes: 15,
    purpose: 'Deep learning fine-tuning benchmark run',
    status: 'WAITLISTED',
    is_demo: true,
  }).select().single()

  if (waitlistBooking) {
    await adminClient.from('waitlist_entries').upsert({
      id: 'w1111111-1111-1111-1111-111111111111',
      resource_id: 'd4444444-4444-4444-4444-444444444444',
      requester_id: requesterId,
      booking_id: waitlistBooking.id,
      position: 1,
      status: 'WAITING',
    })
  }

  // 10. Seed One Open Incident
  const { data: incData } = await adminClient.from('incidents').upsert({
    id: 'inc11111-1111-1111-1111-111111111111',
    resource_id: 'd3333333-3333-3333-3333-333333333333',
    reporter_id: requesterId,
    assignee_id: managerId,
    category: 'DAMAGE',
    severity: 'MEDIUM',
    status: 'UNDER_REVIEW',
    description: 'UV filter thread on the 24-70mm lens has slight hairline dent from tripod clamp vibration.',
    resolution_notes: 'Under review by lab manager; scheduled for replacement glass inspection.',
    is_demo: true,
  }).select().single()

  if (incData) {
    await adminClient.from('incident_updates').upsert({
      incident_id: incData.id,
      author_id: managerId,
      status_from: 'OPEN',
      status_to: 'UNDER_REVIEW',
      note: 'Inspected camera kit bag. Main optics clean; replaced outer screw-on protector ring.',
    })
  }

  // 11. Initial Notifications
  await adminClient.from('notifications').upsert([
    {
      recipient_id: requesterId,
      title: 'Welcome to ShareGrid PSIT',
      message: 'Explore campus lab resources, complete required safety modules, and submit reservations.',
      type: 'SYSTEM_WELCOME',
      is_demo: true,
    },
    {
      recipient_id: ownerId,
      title: 'Lab Resource Catalog Active',
      message: 'Your laboratory equipment listings are published on the ShareGrid campus marketplace.',
      type: 'SYSTEM_INFO',
      is_demo: true,
    },
  ])

  console.log('[OK] Historical bookings, waitlist, incidents, and notifications seeded!')
  console.log('--- Demo Users & Data Seeding Complete ---')
}

seed().catch((err) => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})
