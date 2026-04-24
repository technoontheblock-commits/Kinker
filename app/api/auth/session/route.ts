import { NextResponse } from 'next/server'
import { getCurrentUser, clearSessionCookie } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const user = getCurrentUser()
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

// DELETE /api/auth/session - Logout
export async function DELETE() {
  const user = getCurrentUser()
  
  if (user) {
    const supabase = createServerSupabase()
    if (supabase) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
    }
  }
  
  clearSessionCookie()
  return NextResponse.json({ success: true })
}
