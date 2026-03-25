import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  return JSON.parse(session)
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
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(name, date, time, image, venue)
      `)
      .eq('holder_email', user.email)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate QR data for each ticket
    const ticketsWithQR = tickets?.map(ticket => ({
      ...ticket,
      qr_data: generateQRData(ticket)
    }))

    return NextResponse.json(ticketsWithQR || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/tickets/user - Transfer ticket
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
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
