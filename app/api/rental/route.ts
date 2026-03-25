import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/rental - Get all rental inquiries
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('rental_inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET rental inquiries error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET rental inquiries exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rental - Create new rental inquiry
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('rental_inquiries')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone,
        event_type: body.eventType,
        event_date: body.date,
        guests: parseInt(body.guests) || 0,
        rooms: body.rooms,
        extras: body.extras,
        message: body.message,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('POST rental inquiry error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for admin
    await supabase.from('notifications').insert([{
      type: 'booking',
      title: 'Neue Raumanfrage',
      message: `Neue Anfrage für ${body.rooms?.join(', ') || 'Räume'} am ${body.date}`,
      read: false
    }])

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST rental inquiry exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
