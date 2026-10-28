import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local if present, else .env
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_URL',
  'VITE_DEMO_MODE',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEMO_RESET_SECRET',
]

console.log('--- Verifying Environment Variables ---')
let hasErrors = false

// Check existence
for (const varName of REQUIRED_VARS) {
  const val = process.env[varName]
  if (!val || val.trim() === '') {
    console.error(`[FAIL] Missing required variable: ${varName}`)
    hasErrors = true
  } else {
    console.log(`[PASS] Variable present: ${varName}`)
  }
}

// Security checks
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
for (const key of Object.keys(process.env)) {
  if (key.startsWith('VITE_')) {
    const val = process.env[key] || ''
    if (serviceRoleKey && val.includes(serviceRoleKey)) {
      console.error(`[SECURITY ERROR] VITE_ variable "${key}" contains SUPABASE_SERVICE_ROLE_KEY!`)
      hasErrors = true
    }
    if (key.includes('SECRET') || key.includes('SERVICE_ROLE') || key.includes('PASSWORD') || key.includes('ACCESS_TOKEN')) {
      console.error(`[SECURITY ERROR] Variable "${key}" has VITE_ prefix but appears to be a secret!`)
      hasErrors = true
    }
  }
}

if (hasErrors) {
  console.error('\nEnvironment verification failed!')
  process.exit(1)
} else {
  console.log('\nAll required environment variables are set and validated successfully.')
}
