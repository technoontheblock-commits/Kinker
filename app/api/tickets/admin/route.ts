import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/tickets/admin - Get all tickets (admin only)
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First get all tickets
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get event data separately
    const eventIds = tickets?.map(t => t.event_id).filter(Boolean) || []
    let eventsMap: Record<string, any> = {}
    
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, date')
        .in('id', eventIds)
      
      events?.forEach(e => {
        eventsMap[e.id] = e
      })
    }

    // Combine ticket data with event data
    const ticketsWithEvents = tickets?.map(ticket => ({
      ...ticket,
      event: eventsMap[ticket.event_id] || { name: 'Unknown Event', date: null }
    }))

    return NextResponse.json(ticketsWithEvents || [])
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
