import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data: events, error } = await (supabase as any)
      .from('bar_events')
      .select('*, event_bars(*)')
      .order('date', { ascending: false })

    if (error) {
      console.error('Fetch bar events error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error('Bar events GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { name, date, location, status } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Datum ist erforderlich' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_events')
      .insert([{
        name,
        date,
        location: location || null,
        status: status || 'upcoming',
      }])
      .select()
      .single()

    if (error) {
      console.error('Create bar event error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error: any) {
    console.error('Bar events POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
