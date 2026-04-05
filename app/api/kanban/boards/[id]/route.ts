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

// GET /api/kanban/boards/[id] - Get board with lists and cards
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

    // Get board
    const { data: board, error: boardError } = await supabase
      .from('kanban_boards')
      .select('*')
      .eq('id', id)
      .single()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Get lists
    const { data: lists, error: listsError } = await supabase
      .from('kanban_lists')
      .select('*')
      .eq('board_id', id)
      .order('position', { ascending: true })

    if (listsError) {
      console.error('Error fetching lists:', listsError)
      return NextResponse.json({ error: listsError.message }, { status: 500 })
    }

    // Get cards for all lists
    const listIds = (lists || []).map((l: any) => l.id)
    let cards: any[] = []
    
    if (listIds.length > 0) {
      const { data: cardsData, error: cardsError } = await supabase
        .from('kanban_cards')
        .select('*')
        .in('list_id', listIds)
        .order('position', { ascending: true })
      
      if (!cardsError && cardsData) {
        cards = cardsData
      }
    }

    // Get users for assignments
    const userIds = Array.from(new Set(cards.filter(c => c.assigned_to).map(c => c.assigned_to)))
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds)
      if (usersData) users = usersData
    }

    // Build response
    const listsWithCards = (lists || []).map((list: any) => ({
      ...list,
      cards: cards
        .filter((c: any) => c.list_id === list.id)
        .map((card: any) => ({
          ...card,
          assigned_user: users.find((u: any) => u.id === card.assigned_to) || null
        }))
    }))

    return NextResponse.json({
      ...board,
      lists: listsWithCards
    })
  } catch (error: any) {
    console.error('Error in board GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/kanban/boards/[id] - Update board
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
    const { title, description } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('kanban_boards')
      .update({
        title,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in board PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/kanban/boards/[id] - Delete board
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
      .from('kanban_boards')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in board DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
