import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

// GET /api/user/sessions - List active sessions
export async function GET() {
  const { authorized, user, response } = await requireAuth()
  if (!authorized) return response

  const supabase = createServerSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading sessions:', error)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }

  return NextResponse.json({ sessions: sessions || [] })
}

// DELETE /api/user/sessions - Delete all other sessions
export async function DELETE() {
  const { authorized, user, response } = await requireAuth()
  if (!authorized) return response

  const supabase = createServerSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const { data: currentSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', user.id)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single()

  if (currentSession) {
    const { error } = await (supabase as any)
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .neq('id', (currentSession as any).id)

    if (error) {
      console.error('Error deleting sessions:', error)
      return NextResponse.json({ error: 'Failed to delete sessions' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
