// Follows Supabase Edge Function standards (Deno)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-demo-secret',
      },
    })
  }

  try {
    const demoSecret = Deno.env.get('DEMO_RESET_SECRET')
    const incomingSecret = req.headers.get('x-demo-secret')

    // 1. Guard Secret Check
    if (!demoSecret || incomingSecret !== demoSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid demo reset secret' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceRole)

    // 2. Truncate / clean only is_demo = true rows
    await adminClient.from('incident_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('incidents').delete().eq('is_demo', true)
    await adminClient.from('condition_report_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('condition_reports').delete().eq('is_demo', true)
    await adminClient.from('booking_decisions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('waitlist_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('usage_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('notifications').delete().eq('is_demo', true)
    await adminClient.from('bookings').delete().eq('is_demo', true)
    await adminClient.from('training_records').delete().eq('is_demo', true)

    return new Response(JSON.stringify({ success: true, message: 'Demo data cleaned successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
