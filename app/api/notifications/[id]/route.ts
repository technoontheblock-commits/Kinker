import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// PUT /api/notifications/[id] - Update notification (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updatePayload: any = {}
    if (body.read !== undefined) updatePayload.read = body.read
    if (body.title !== undefined) updatePayload.title = body.title
    if (body.message !== undefined) updatePayload.message = body.message
    
    updatePayload.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('notifications')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('PUT notification error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT notification exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('DELETE notification error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE notification exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
