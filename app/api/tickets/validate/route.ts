import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ valid: false, message: 'Server error' })
    }
    
    const body = await request.json()
    const { qr_code } = body
    
    if (!qr_code) {
      return NextResponse.json({ valid: false, message: 'QR Code fehlt' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, event:events(name, date)')
      .eq('qr_code', qr_code)
      .single()

    if (!ticket) {
      return NextResponse.json({ valid: false, message: 'Ungültiges Ticket' })
    }

    if (ticket.status === 'used') {
      return NextResponse.json({ 
        valid: false, 
        message: 'Bereits verwendet',
        used_at: ticket.used_at
      })
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ valid: false, message: 'Ticket storniert' })
    }

    // Mark as used
    await supabase.from('tickets').update({ 
      status: 'used', 
      used_at: new Date().toISOString() 
    }).eq('id', ticket.id)

    return NextResponse.json({
      valid: true,
      message: 'Gültig - Einlass gewährt',
      ticket: {
        number: ticket.ticket_number,
        event: ticket.event?.name,
        holder: ticket.holder_name
      }
    })
  } catch (error) {
    return NextResponse.json({ valid: false, message: 'Server error' })
  }
}
