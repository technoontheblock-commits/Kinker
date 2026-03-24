import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// PUT /api/jobs/[id] - Update job
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
    if (body.title !== undefined) updatePayload.title = body.title
    if (body.department !== undefined) updatePayload.department = body.department
    if (body.type !== undefined) updatePayload.type = body.type
    if (body.location !== undefined) updatePayload.location = body.location
    if (body.description !== undefined) updatePayload.description = body.description
    if (body.status !== undefined) updatePayload.status = body.status
    
    updatePayload.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('PUT job error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT job exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete job
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
      .from('jobs')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('DELETE job error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE job exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
