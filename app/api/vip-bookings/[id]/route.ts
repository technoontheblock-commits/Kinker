import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

// PUT /api/vip-bookings/[id] - Update booking status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only admins can update booking status
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can update booking status' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('vip_bookings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating VIP booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user and event data manually
    const [{ data: userData }, { data: eventData }] = await Promise.all([
      supabase.from('users').select('id, name, email').eq('id', data.user_id).single(),
      supabase.from('events').select('id, name, date').eq('id', data.event_id).single()
    ])

    return NextResponse.json({
      ...data,
      user: userData || { id: data.user_id, name: 'Unknown', email: '' },
      event: eventData || { id: data.event_id, name: 'Unknown Event', date: '' }
    })
  } catch (error: any) {
    console.error('Error in VIP booking PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/vip-bookings/[id] - Delete booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only admins can delete bookings
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can delete bookings' },
        { status: 403 }
      )
    }

    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('vip_bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting VIP booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in VIP booking DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
