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

// GET /api/kanban/cards?listId=xxx - Get cards for a list
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')

    if (!listId) {
      return NextResponse.json({ error: 'listId is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: cards, error } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get users for assignments
    const userIds = Array.from(new Set((cards || []).filter(c => c.assigned_to).map(c => c.assigned_to)))
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds)
      if (usersData) users = usersData
    }

    const cardsWithUsers = (cards || []).map(card => ({
      ...card,
      assigned_user: users.find((u: any) => u.id === card.assigned_to) || null
    }))

    return NextResponse.json(cardsWithUsers)
  } catch (error: any) {
    console.error('Error in cards GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/kanban/cards - Create a new card
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, list_id, assigned_to, due_date, position } = body

    if (!title || !list_id) {
      return NextResponse.json({ error: 'title and list_id are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get max position if not provided
    let cardPosition = position
    if (cardPosition === undefined) {
      const { data: maxPos } = await supabase
        .from('kanban_cards')
        .select('position')
        .eq('list_id', list_id)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      cardPosition = (maxPos?.position ?? -1) + 1
    }

    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        title,
        description,
        list_id,
        assigned_to,
        due_date,
        position: cardPosition,
        created_by: user.id
      })
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

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error in cards POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/kanban/cards - Update a card
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, description, list_id, assigned_to, due_date, position } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

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
    console.error('Error in cards PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/kanban/cards?id=xxx - Delete a card
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

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
    console.error('Error in cards DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
