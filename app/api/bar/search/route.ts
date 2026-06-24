import { NextRequest, NextResponse } from 'next/server'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { getFirstName } from '@/lib/bar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBar()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Mindestens 2 Zeichen eingeben' }, { status: 400 })
    }

    const term = `%${query.trim()}%`

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    // Search active users by name, email or phone and join their wallet
    const { data, error } = await (supabase as any)
      .from('users')
      .select('id, name, email, phone, bar_wallets!inner(id, qr_token, balance, currency)')
      .eq('status', 'active')
      .or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
      .limit(20)

    if (error) {
      console.error('Bar search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const customers = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      firstName: getFirstName(row.name),
      email: row.email,
      balance: Number(row.bar_wallets?.balance || 0),
      currency: row.bar_wallets?.currency || 'CHF',
      walletToken: row.bar_wallets?.qr_token || '',
    }))

    return NextResponse.json({ customers })
  } catch (error: any) {
    console.error('Bar search route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
