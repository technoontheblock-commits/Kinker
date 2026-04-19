import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// PUT /api/merchandise/[id] - Update merchandise item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updatePayload: any = {}
    if (body.name !== undefined) updatePayload.name = body.name
    if (body.description !== undefined) updatePayload.description = body.description
    if (body.price !== undefined) updatePayload.price = body.price
    if (body.image !== undefined) updatePayload.image = body.image
    if (body.category !== undefined) updatePayload.category = body.category
    if (body.sizes !== undefined) updatePayload.sizes = body.sizes
    if (body.stock !== undefined) updatePayload.stock = body.stock
    if (body.active !== undefined) updatePayload.active = body.active
    
    updatePayload.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('merchandise')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('PUT merchandise error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT merchandise exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/merchandise/[id] - Delete merchandise item (soft delete) (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase
      .from('merchandise')
      .update({ active: false })
      .eq('id', params.id)

    if (error) {
      console.error('DELETE merchandise error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE merchandise exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
