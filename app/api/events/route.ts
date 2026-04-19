import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/events - Get all events
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      console.error('GET events error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET events exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/events - Create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('POST event body:', body)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Only required field is name and date
    const insertPayload: any = {
      id: randomUUID(),
      name: body.name || 'Unnamed Event',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '22:00',
      end_time: body.end_time || null,
      type: body.type || 'clubnight',
      price: body.price || 'CHF 25',
      description: body.description || '',
      full_description: body.full_description || body.description || '',
      lineup: body.lineup || [],
      timetable: body.timetable || null,
      image: body.image || '',
      ticket_url: body.ticket_link || body.ticket_url || '',
    }
    
    console.log('Insert payload:', insertPayload)
    
    const { data, error } = await supabase
      .from('events')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('POST event error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST event exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
