import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// PUT /api/applications/[id] - Update application status
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
    if (body.status !== undefined) updatePayload.status = body.status
    if (body.notes !== undefined) updatePayload.notes = body.notes
    
    updatePayload.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('job_applications')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('PUT application error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT application exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/applications/[id] - Delete application
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
      .from('job_applications')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('DELETE application error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE application exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
