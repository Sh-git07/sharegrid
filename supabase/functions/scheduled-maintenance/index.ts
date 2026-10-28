import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceRole)

    const nowIso = new Date().toISOString()

    // 1. Mark overdue bookings: status was CHECKED_IN but end_time has passed
    const { data: lateBookings } = await adminClient
      .from('bookings')
      .select('id, requester_id, resource:resources(title)')
      .eq('status', 'CHECKED_IN')
      .lt('end_time', nowIso)

    if (lateBookings && lateBookings.length > 0) {
      for (const b of lateBookings) {
        await adminClient
          .from('bookings')
          .update({ status: 'OVERDUE', updated_at: nowIso })
          .eq('id', b.id)

        // Notify requester
        await adminClient.from('notifications').insert({
          recipient_id: b.requester_id,
          title: 'Booking Overdue Warning',
          message: `Your booking for ${(b.resource as any)?.title || 'equipment'} has passed its scheduled end time. Please return the item immediately.`,
          type: 'BOOKING_OVERDUE',
          entity_type: 'booking',
          entity_id: b.id,
        })
      }
    }

    return new Response(JSON.stringify({ success: true, overdueCount: lateBookings?.length || 0 }), {
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
