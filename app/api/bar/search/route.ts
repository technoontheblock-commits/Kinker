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

    const term = query.trim()
    const ilikeTerm = `%${term}%`

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabaseAny = supabase as any

    // Search active users by name, email or phone in parallel.
    // Three separate queries avoid PostgREST .or() parsing issues with
    // special characters such as dots or @ in email addresses.
    const selectColumns = 'id, name, email, phone'
    const [nameResult, emailResult, phoneResult] = await Promise.all([
      supabaseAny.from('users').select(selectColumns).eq('status', 'active').ilike('name', ilikeTerm).limit(20),
      supabaseAny.from('users').select(selectColumns).eq('status', 'active').ilike('email', ilikeTerm).limit(20),
      supabaseAny.from('users').select(selectColumns).eq('status', 'active').ilike('phone', ilikeTerm).limit(20),
    ])

    if (nameResult.error) {
      console.error('Bar search name error:', nameResult.error)
      return NextResponse.json({ error: nameResult.error.message }, { status: 500 })
    }
    if (emailResult.error) {
      console.error('Bar search email error:', emailResult.error)
      return NextResponse.json({ error: emailResult.error.message }, { status: 500 })
    }
    if (phoneResult.error) {
      console.error('Bar search phone error:', phoneResult.error)
      return NextResponse.json({ error: phoneResult.error.message }, { status: 500 })
    }

    const userById = new Map<string, any>()
    const addUsers = (rows: any[] | null) => {
      for (const user of rows || []) {
        if (user && user.id) {
          userById.set(user.id, user)
        }
      }
    }
    addUsers(nameResult.data)
    addUsers(emailResult.data)
    addUsers(phoneResult.data)

    const users = Array.from(userById.values()).slice(0, 20)

    if (users.length === 0) {
      return NextResponse.json({ customers: [] })
    }

    const userIds = users.map((u: any) => u.id)

    // Load existing wallets for these users
    const { data: wallets, error: walletsError } = await supabaseAny
      .from('bar_wallets')
      .select('id, user_id, qr_token, balance, currency')
      .in('user_id', userIds)

    if (walletsError) {
      console.error('Bar search wallets error:', walletsError)
      return NextResponse.json({ error: walletsError.message }, { status: 500 })
    }

    // Ensure every found user has a wallet (create missing ones)
    const walletByUserId = new Map<string, any>((wallets || []).map((w: any) => [w.user_id, w]))
    const missingUserIds = userIds.filter((id: string) => !walletByUserId.has(id))

    if (missingUserIds.length > 0) {
      const inserts = missingUserIds.map((id: string) => ({
        user_id: id,
        qr_token: crypto.randomUUID(),
        balance: 0,
        currency: 'CHF',
      }))

      const { data: newWallets, error: insertError } = await supabaseAny
        .from('bar_wallets')
        .insert(inserts)
        .select('id, user_id, qr_token, balance, currency')

      if (insertError) {
        console.error('Bar search wallet insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      for (const w of (newWallets || []) as any[]) {
        walletByUserId.set(w.user_id, w)
      }
    }

    const customers = users.map((user: any) => {
      const wallet = walletByUserId.get(user.id) as any
      return {
        id: user.id,
        name: user.name,
        firstName: getFirstName(user.name),
        email: user.email,
        phone: user.phone,
        balance: Number(wallet?.balance || 0),
        currency: wallet?.currency || 'CHF',
        walletToken: wallet?.qr_token || '',
      }
    })

    return NextResponse.json({ customers })
  } catch (error: any) {
    console.error('Bar search route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
