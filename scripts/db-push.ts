import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pass = process.env.SUPABASE_DB_PASSWORD
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!pass) {
  console.error('SUPABASE_DB_PASSWORD is required to push migrations')
  process.exit(1)
}

try {
  console.log('Pushing migrations to Supabase...')
  const out = execSync(`npx supabase db push --password "${pass}" --include-all`, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    stdio: 'inherit',
  })
  console.log('Migrations push completed.')
} catch (err: any) {
  console.error('Error during db push:', err.message)
  process.exit(1)
}
