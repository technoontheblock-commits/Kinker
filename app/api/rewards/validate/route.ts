import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



// GET /api/rewards/validate?code=XXX - Validate a reward code
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find redemption by code
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        rewards(*)
      `)
      .eq('code', code)
      .single()

    if (redemptionError || !redemption) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    // Check if expired
    if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', redemption.user_id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      redemption: {
        id: redemption.id,
        code: redemption.code,
        points_used: redemption.points_used,
        status: redemption.status,
        created_at: redemption.created_at,
        expires_at: redemption.expires_at,
        used_at: redemption.used_at
      },
      reward: redemption.rewards,
      user: userData
    })
  } catch (error: any) {
    console.error('Validate reward error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
