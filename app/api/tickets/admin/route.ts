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

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(name, date)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tickets || [])
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
