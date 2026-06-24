import { NextRequest, NextResponse } from 'next/server'
import { requireTopUp } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { extractWalletTokenFromQR, getFirstName } from '@/lib/bar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTopUp()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { qr_code } = body

    if (!qr_code || typeof qr_code !== 'string') {
      return NextResponse.json({ error: 'QR-Code fehlt' }, { status: 400 })
    }

    const token = extractWalletTokenFromQR(qr_code)
    if (!token) {
      return NextResponse.json({ error: 'Ungültiger Wallet-QR-Code' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data: wallet, error: walletError } = await (supabase as any)
      .from('bar_wallets')
      .select('id, user_id, qr_token, balance, currency')
      .eq('qr_token', token)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet nicht gefunden' }, { status: 404 })
    }

    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('id, name, email, phone')
      .eq('id', wallet.user_id)
      .eq('status', 'active')
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Kunde nicht gefunden oder inaktiv' }, { status: 404 })
    }

    return NextResponse.json({
      customer: {
        id: user.id,
        name: user.name,
        firstName: getFirstName(user.name),
        email: user.email,
        phone: user.phone,
        balance: Number(wallet.balance),
        currency: wallet.currency,
        walletToken: wallet.qr_token,
      }
    })
  } catch (error: any) {
    console.error('Top-up scan error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
