import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



function isAdmin(user: any) {
  return user?.role === 'admin'
}

// PUT /api/kanban/lists/[id] - Update a list
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { title, position } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updates.title = title
    if (position !== undefined) updates.position = position

    const { data, error } = await supabase
      .from('kanban_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in list PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/kanban/lists/[id] - Delete a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('kanban_lists')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in list DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
