import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

interface ReferralRedemption {
  id: string
  card_number: string
  holder_name: string
  holder_email: string
  purchase_price: number
  payment_status: string
  purchased_at: string
  referral_code: string
  referrer_id: string
  referrer_name: string
  referrer_email: string
  referrer_role: string
  referee_id: string | null
  referee_name: string
  referee_email: string
}

// GET /api/admin/referrals - Get all redeemed referral codes with referrer info
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get all bonus cards that used a referral code
    const { data: cards, error: cardsError } = await supabase
      .from('bonus_cards')
      .select('id, card_number, holder_name, holder_email, purchase_price, payment_status, purchased_at, referral_code_used, user_id')
      .not('referral_code_used', 'is', null)
      .order('purchased_at', { ascending: false })

    if (cardsError) {
      console.error('Error fetching bonus cards:', cardsError)
      return NextResponse.json({ error: cardsError.message }, { status: 500 })
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json({ redemptions: [] })
    }

    // 2. Get all referral codes used
    const codeIds = Array.from(new Set(cards.map(c => c.referral_code_used).filter(Boolean)))
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('id, code, user_id')
      .in('id', codeIds)

    if (codesError) {
      console.error('Error fetching referral codes:', codesError)
      return NextResponse.json({ error: codesError.message }, { status: 500 })
    }

    // 3. Get all users (referrers + referees)
    const userIds = Array.from(new Set([
      ...cards.map(c => c.user_id).filter(Boolean),
      ...codes.map(c => c.user_id).filter(Boolean)
    ]))

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Build lookup maps
    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    const codeMap = new Map(codes?.map(c => [c.id, c]) || [])

    // 4. Join everything together
    const redemptions: ReferralRedemption[] = cards.map(card => {
      const code = codeMap.get(card.referral_code_used!)
      const referrer = code ? userMap.get(code.user_id) : null
      const referee = card.user_id ? userMap.get(card.user_id) : null

      return {
        id: card.id,
        card_number: card.card_number,
        holder_name: card.holder_name,
        holder_email: card.holder_email,
        purchase_price: card.purchase_price,
        payment_status: card.payment_status,
        purchased_at: card.purchased_at,
        referral_code: code?.code || 'Unknown',
        referrer_id: code?.user_id || '',
        referrer_name: referrer?.name || referrer?.email?.split('@')[0] || 'Unbekannt',
        referrer_email: referrer?.email || '',
        referrer_role: referrer?.role || 'user',
        referee_id: card.user_id,
        referee_name: referee?.name || card.holder_name || 'Unbekannt',
        referee_email: referee?.email || card.holder_email || ''
      }
    })

    return NextResponse.json({ redemptions })
  } catch (error: any) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
