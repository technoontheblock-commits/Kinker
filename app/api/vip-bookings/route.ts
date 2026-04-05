import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  try {
    return JSON.parse(session)
  } catch {
    return null
  }
}

function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/vip-bookings - Get VIP bookings
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // If admin, get all bookings
    if (isAdmin(user)) {
      const { data: bookings, error } = await supabase
        .from('vip_bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching VIP bookings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Fetch user and event data manually
      const bookingsWithDetails = await Promise.all(
        (bookings || []).map(async (booking) => {
          // Get user data
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', booking.user_id)
            .single()
          
          // Get event data
          const { data: eventData } = await supabase
            .from('events')
            .select('id, name, date')
            .eq('id', booking.event_id)
            .single()

          return {
            ...booking,
            user: userData || { id: booking.user_id, name: 'Unknown', email: '' },
            event: eventData || { id: booking.event_id, name: 'Unknown Event', date: '' }
          }
        })
      )

      return NextResponse.json(bookingsWithDetails)
    }
    
    // Regular users only see their own bookings
    const { data: bookings, error } = await supabase
      .from('vip_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching VIP bookings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch event data for user's bookings
    const bookingsWithEvents = await Promise.all(
      (bookings || []).map(async (booking) => {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, name, date')
          .eq('id', booking.event_id)
          .single()

        return {
          ...booking,
          event: eventData || { id: booking.event_id, name: 'Unknown Event', date: '' }
        }
      })
    )

    return NextResponse.json(bookingsWithEvents)
  } catch (error: any) {
    console.error('Error in VIP bookings GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/vip-bookings - Create new VIP booking
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { event_id, package: packageType, notes } = body

    // Validation
    if (!event_id || !packageType) {
      return NextResponse.json(
        { error: 'Event and package are required' },
        { status: 400 }
      )
    }

    // Validate package type
    const validPackages = ['Bronze', 'Silver', 'Gold']
    if (!validPackages.includes(packageType)) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if user already has a pending/approved booking for this event
    const { data: existingBooking, error: existingError } = await supabase
      .from('vip_bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', event_id)
      .in('status', ['pending', 'approved'])
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a booking for this event' },
        { status: 409 }
      )
    }

    // Create booking
    const { data, error } = await supabase
      .from('vip_bookings')
      .insert({
        id: randomUUID(),
        user_id: user.id,
        event_id,
        package: packageType,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating VIP booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get event data for response
    const { data: eventData } = await supabase
      .from('events')
      .select('id, name, date')
      .eq('id', event_id)
      .single()

    return NextResponse.json({
      ...data,
      event: eventData || { id: event_id, name: 'Unknown Event', date: '' }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in VIP bookings POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
