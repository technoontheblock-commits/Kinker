import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code fehlt' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('id, user_id, code')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (!referralCode) {
      return NextResponse.json({ valid: false, error: 'Ungültiger Code' }, { status: 200 })
    }

    // Check for self-referral
    const currentUser = getCurrentUser()
    if (currentUser && referralCode.user_id === currentUser.id) {
      return NextResponse.json({ valid: false, error: 'Eigener Code kann nicht verwendet werden' }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      discount_percent: 10,
      discount_amount: 1000, // 10 CHF in Rappen
      final_price: 9000 // 90 CHF in Rappen
    })
  } catch (error) {
    console.error('Referral validate error:', error)
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten' }, { status: 500 })
  }
}
