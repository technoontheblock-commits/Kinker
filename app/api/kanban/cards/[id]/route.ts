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

// GET /api/kanban/cards/[id] - Get a single card with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Get assigned user if any
    if (data.assigned_to) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', data.assigned_to)
        .single()
      data.assigned_user = userData
    }

    // Get list info
    const { data: listData } = await supabase
      .from('kanban_lists')
      .select('id, title, board_id')
      .eq('id', data.list_id)
      .single()
    data.list = listData

    // Get comments
    const { data: comments } = await supabase
      .from('kanban_card_comments')
      .select('*')
      .eq('card_id', id)
      .order('created_at', { ascending: true })

    // Get users for comments
    const commentUserIds = Array.from(new Set((comments || []).map(c => c.user_id)))
    let commentUsers: any[] = []
    if (commentUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', commentUserIds)
      if (usersData) commentUsers = usersData
    }

    data.comments = (comments || []).map(c => ({
      ...c,
      user: commentUsers.find((u: any) => u.id === c.user_id) || null
    }))

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in card GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/kanban/cards/[id] - Update a card
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
    const { title, description, list_id, assigned_to, due_date, position } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (list_id !== undefined) updates.list_id = list_id
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (due_date !== undefined) updates.due_date = due_date
    if (position !== undefined) updates.position = position

    const { data, error } = await supabase
      .from('kanban_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get assigned user if any
    if (data.assigned_to) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', data.assigned_to)
        .single()
      data.assigned_user = userData
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in card PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/kanban/cards/[id] - Delete a card
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
      .from('kanban_cards')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in card DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
