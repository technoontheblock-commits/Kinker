import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/events/[id] - Update event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updatePayload: any = {}
    
    if (body.name !== undefined) updatePayload.name = body.name
    if (body.date !== undefined) updatePayload.date = body.date
    if (body.time !== undefined) updatePayload.time = body.time
    if (body.end_time !== undefined) updatePayload.end_time = body.end_time
    if (body.type !== undefined) updatePayload.type = body.type
    if (body.price !== undefined) updatePayload.price = body.price
    if (body.description !== undefined) updatePayload.description = body.description
    if (body.full_description !== undefined) updatePayload.full_description = body.full_description
    if (body.lineup !== undefined) updatePayload.lineup = body.lineup
    if (body.timetable !== undefined) updatePayload.timetable = body.timetable
    if (body.image !== undefined) updatePayload.image = body.image
    if (body.ticket_link !== undefined) updatePayload.ticket_url = body.ticket_link
    if (body.ticket_url !== undefined) updatePayload.ticket_url = body.ticket_url
    
    updatePayload.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Delete event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First check if event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .eq('id', params.id)
      .single()
    
    if (fetchError) {
      console.error('DELETE event fetch error:', fetchError)
      return NextResponse.json({ error: `Fetch error: ${fetchError.message}`, code: fetchError.code }, { status: 500 })
    }
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Find event_tickets for this event
    const { data: eventTickets, error: etFetchError } = await (supabase as any)
      .from('event_tickets')
      .select('id')
      .eq('event_id', params.id)
    
    if (etFetchError) {
      console.error('FETCH event_tickets error:', etFetchError)
      // Continue anyway — table might not exist
    }
    
    const eventTicketIds = eventTickets?.map((t: any) => t.id) || []
    
    // Delete order_items referencing these event_tickets
    if (eventTicketIds.length > 0) {
      const { error: oiError } = await supabase
        .from('order_items')
        .delete()
        .in('event_ticket_id', eventTicketIds)
      
      if (oiError) {
        console.error('DELETE order_items error:', oiError)
        return NextResponse.json({ error: `Failed to delete related order items: ${oiError.message}` }, { status: 500 })
      }
      
      // Delete cart_items referencing these event_tickets
      const { error: ciError } = await supabase
        .from('cart_items')
        .delete()
        .in('event_ticket_id', eventTicketIds)
      
      if (ciError) {
        console.error('DELETE cart_items error:', ciError)
        // Non-fatal
      }
    }
    
    // Delete order_items directly referencing this event
    const { error: oiDirectError } = await supabase
      .from('order_items')
      .delete()
      .eq('event_id', params.id)
    
    if (oiDirectError) {
      console.error('DELETE order_items direct error:', oiDirectError)
    }
    
    // Delete related event_tickets
    const { error: etError } = await (supabase as any)
      .from('event_tickets')
      .delete()
      .eq('event_id', params.id)
    
    if (etError) {
      console.error('DELETE event_tickets error:', etError)
      // Continue anyway
    }
    
    // Delete related tickets
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('event_id', params.id)
    
    if (ticketsError) {
      console.error('DELETE tickets error:', ticketsError)
      return NextResponse.json({ error: `Failed to delete related tickets: ${ticketsError.message}` }, { status: 500 })
    }
    
    // Delete related cart items referencing this event
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('event_id', params.id)
    
    if (cartError) {
      console.error('DELETE cart items error:', cartError)
      // Non-fatal
    }
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('DELETE event error:', error)
      return NextResponse.json({ error: error.message, code: error.code, hint: error.hint }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE event exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
