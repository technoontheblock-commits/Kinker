import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to check if user is admin
async function isAdmin() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) return false
  
  try {
    const session = JSON.parse(sessionCookie)
    return session.user?.role === 'admin' || session.user?.role === 'staff'
  } catch {
    return false
  }
}

// POST /api/tickets/admin/payment - Update ticket payment status
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, status } = body

    if (!ticket_id || !status) {
      return NextResponse.json({ error: 'Ticket ID and status required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticket: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
