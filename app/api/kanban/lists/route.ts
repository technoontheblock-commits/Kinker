import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/kanban/lists?boardId=xxx - Get lists for a board
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('kanban_lists')
      .select(`
        *,
        cards:kanban_cards(
          *,
          assigned_user:users(id, name, email, avatar_url),
          created_by_user:users(id, name, email)
        )
      `)
      .eq('board_id', boardId)
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort cards by position within each list
    const listsWithSortedCards = (data || []).map((list: any) => ({
      ...list,
      cards: (list.cards || []).sort((a: any, b: any) => a.position - b.position)
    }))

    return NextResponse.json(listsWithSortedCards)
  } catch (error: any) {
    console.error('Error in lists GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/kanban/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, board_id, position } = body

    if (!title || !board_id) {
      return NextResponse.json({ error: 'title and board_id are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get max position if not provided
    let listPosition = position
    if (listPosition === undefined) {
      const { data: maxPos } = await supabase
        .from('kanban_lists')
        .select('position')
        .eq('board_id', board_id)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      listPosition = (maxPos?.position ?? -1) + 1
    }

    const { data, error } = await supabase
      .from('kanban_lists')
      .insert({
        title,
        board_id,
        position: listPosition
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error in lists POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/kanban/lists - Bulk update lists (for reordering)
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { lists } = body

    if (!Array.isArray(lists)) {
      return NextResponse.json({ error: 'lists array is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update each list position
    const updates = lists.map((list: any) =>
      supabase
        .from('kanban_lists')
        .update({ position: list.position, updated_at: new Date().toISOString() })
        .eq('id', list.id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in lists PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
