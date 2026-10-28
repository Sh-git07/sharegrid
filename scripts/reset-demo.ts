import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey)

async function resetDemo() {
  console.log('Resetting demo transactions...')
  // Delete demo records safely without deleting resources or users
  await adminClient.from('incident_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('condition_report_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('condition_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('booking_decisions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('waitlist_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('usage_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('eligibility_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('training_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('Demo transaction data cleared. Re-running seed...')
  const { execSync } = await import('child_process')
  execSync('npx tsx scripts/seed-demo-users.ts', { stdio: 'inherit' })
  console.log('Demo reset complete.')
}

resetDemo().catch(console.error)
