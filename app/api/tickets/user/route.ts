import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { verifySignedSession } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to get user from session cookie (same as dashboard)
async function getCurrentUser() {
  const cookieStore = cookies()
  
  // Try session cookie first (from /api/auth/session)
  const sessionCookie = cookieStore.get('session')?.value
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie)
      if (session.user) {
        return session.user
      }
    } catch {
      // Invalid cookie, continue to next method
    }
  }
  
  // Try user_session cookie (signed)
  const userSessionCookie = cookieStore.get('user_session')?.value
  if (userSessionCookie) {
    const user = verifySignedSession(userSessionCookie)
    if (user) return user
  }
  
  return null
}

function generateQRData(ticket: any) {
  const secret = process.env.TICKET_SECRET || 'kinker-secret-key'
  const hash = createHash('sha256')
    .update(`${ticket.id}:${ticket.qr_secret || ticket.id}:${secret}`)
    .digest('hex')
    .substring(0, 16)
  return `KINKER:${ticket.ticket_number}:${hash}`
}

// GET /api/tickets/user - Get user's tickets
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First, get tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('holder_email', user.email)
      .order('created_at', { ascending: false })

    if (ticketsError) {
      return NextResponse.json({ 
        error: ticketsError.message, 
        code: ticketsError.code,
      }, { status: 500 })
    }

    // Debug info
    const debug: any = {
      ticketCount: tickets?.length || 0,
      ticketEventIds: tickets?.map(t => ({ 
        ticket_number: t.ticket_number, 
        event_id: t.event_id,
        event_id_type: typeof t.event_id
      })),
      userEmail: user.email
    }

    // Fetch event data separately
    const eventIds = tickets?.map(t => t.event_id).filter(id => id !== null && id !== undefined) || []
    const uniqueEventIds = Array.from(new Set(eventIds))
    
    let eventsMap: Record<string, any> = {}
    
    if (uniqueEventIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name, date, time, image')
        .in('id', uniqueEventIds)
      
      debug.eventQueryError = eventsError?.message || null
      debug.foundEvents = events?.length || 0
      debug.eventIdsSearched = uniqueEventIds
      debug.eventsFound = events?.map(e => ({ id: e.id, name: e.name }))
      
      events?.forEach(e => {
        eventsMap[e.id] = e
      })
    } else {
      debug.noEventIds = true
    }

    // Combine ticket data with event data
    const ticketsWithQR = tickets?.map(ticket => {
      const event = ticket.event_id ? eventsMap[ticket.event_id] : null
      
      return {
        ...ticket,
        event: event || {
          name: 'Unknown Event',
          date: new Date().toISOString(),
          time: '23:00',
          image: '',
          venue: 'KINKER Basel'
        },
        qr_data: generateQRData(ticket)
      }
    })

    // Return tickets with debug info
    return NextResponse.json({
      tickets: ticketsWithQR || [],
      debug: debug
    })
  } catch (error: any) {
    console.error('Tickets API error:', error)
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack,
      name: error.name 
    }, { status: 500 })
  }
}

// POST /api/tickets/user - Transfer ticket
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, new_email } = body

    if (!ticket_id || !new_email) {
      return NextResponse.json({ error: 'Ticket ID and new email required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(new_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify ticket ownership
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .eq('holder_email', user.email)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status !== 'valid') {
      return NextResponse.json({ error: 'Cannot transfer used or cancelled ticket' }, { status: 400 })
    }

    // Update ticket holder
    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({
        holder_email: new_email,
        transferred_from: user.email,
        transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: `Ticket transferred to ${new_email}`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
