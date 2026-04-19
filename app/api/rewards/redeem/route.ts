import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



// POST /api/rewards/redeem - Mark a reward as used
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { redemption_id } = body

    if (!redemption_id) {
      return NextResponse.json({ error: 'Redemption ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get redemption details
    const { data: redemption, error: getError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', redemption_id)
      .single()

    if (getError || !redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
    }

    // Check if already used
    if (redemption.status === 'used') {
      return NextResponse.json({ error: 'Reward already used' }, { status: 400 })
    }

    // Check if expired
    if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Reward has expired' }, { status: 400 })
    }

    // Mark as used
    const { data: updated, error: updateError } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('id', redemption_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reward redeemed successfully',
      redemption: updated
    })
  } catch (error: any) {
    console.error('Redeem reward error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
