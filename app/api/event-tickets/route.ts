import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/event-tickets - Get ticket types for an event
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json([])
    }
    
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let query = supabase
      .from('event_tickets')
      .select('*')
      .eq('active', true)
    
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    
    const { data, error } = await query.order('price', { ascending: true })

    if (error) {
      console.error('GET event tickets error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET event tickets exception:', error)
    return NextResponse.json([])
  }
}

// POST /api/event-tickets - Create ticket type for event
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('event_tickets')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('POST event ticket error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST event ticket exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
