import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ref = process.env.SUPABASE_PROJECT_REF
const pass = process.env.SUPABASE_DB_PASSWORD
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!ref || !pass || !token) {
  console.error('Missing credentials for Supabase CLI link')
  process.exit(1)
}

try {
  console.log('Linking Supabase project...')
  const out = execSync(`npx supabase link --project-ref ${ref} --password "${pass}"`, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    stdio: 'pipe',
  })
  console.log('Link success:', out.toString())
} catch (err: any) {
  console.error('Link error:', err.stderr ? err.stderr.toString() : err.message)
  process.exit(1)
}
