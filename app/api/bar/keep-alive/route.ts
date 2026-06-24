import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBar()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const token = cookies().get('user_session')?.value
    if (token) {
      await (supabase as any)
        .from('user_sessions')
        .update({
          last_active_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('session_token', token)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Bar keep-alive error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
