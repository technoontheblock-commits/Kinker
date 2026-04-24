import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

// DELETE /api/user/sessions/[id] - Delete a specific session
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { authorized, user, response } = await requireAuth()
  if (!authorized) return response

  const supabase = createServerSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
