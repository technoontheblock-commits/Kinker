import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  return JSON.parse(session)
}

const TIERS = [
  { name: 'Bronze', min: 0, multiplier: 1 },
  { name: 'Silver', min: 500, multiplier: 1.2 },
  { name: 'Gold', min: 1500, multiplier: 1.5 },
  { name: 'Platinum', min: 5000, multiplier: 2 }
]

// GET /api/rewards - Get user's rewards and available rewards
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First verify the user exists in the database (try by ID first, then by email)
    let dbUserId = user.id
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!dbUser) {
      // Try finding by email as fallback
      const { data: dbUserByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()
      
      if (dbUserByEmail) {
        dbUserId = dbUserByEmail.id
      }
    } else {
      dbUserId = dbUser.id
    }
    
    // Get or create rewards record
    let { data: rewards } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', dbUserId)
      .single()
    
    if (!rewards) {
      const { data: newRewards, error: insertError } = await supabase
        .from('user_rewards')
        .insert({ 
          user_id: dbUserId, 
          points: 0,
          lifetime_points: 0,
          tier: 'Bronze'
        })
        .select()
        .single()
      if (insertError) {
        console.error('Error creating rewards record:', insertError)
        return NextResponse.json({ error: 'Failed to create rewards record' }, { status: 500 })
      }
      rewards = newRewards
    }
    
    // Calculate tier
    const tier = TIERS.slice().reverse().find(t => (rewards?.lifetime_points || 0) >= t.min) || TIERS[0]
    const nextTier = TIERS.find(t => t.min > (rewards?.lifetime_points || 0))
    
    // Get available rewards
    const { data: availableRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .lte('points_cost', rewards?.points || 0)
      .order('points_cost', { ascending: true })

    if (rewardsError) {
      return NextResponse.json({ error: rewardsError.message }, { status: 500 })
    }
    
    // Get all rewards for browsing
    const { data: allRewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_cost', { ascending: true })
    
    // Get redemption history
    const { data: history, error: historyError } = await supabase
      .from('reward_redemptions')
      .select('*, rewards(name)')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }

    return NextResponse.json({
      points: rewards?.points || 0,
      lifetimePoints: rewards?.lifetime_points || 0,
      tier: tier.name,
      multiplier: tier.multiplier,
      nextTier,
      availableRewards: availableRewards || [],
      allRewards: allRewards || [],
      history: history || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/rewards - Redeem a reward
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { reward_id } = body

    if (!reward_id) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First verify the user exists in the database (try by ID first, then by email)
    let dbUserId = user.id
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!dbUser) {
      // Try finding by email as fallback
      const { data: dbUserByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()
      
      if (dbUserByEmail) {
        dbUserId = dbUserByEmail.id
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } else {
      dbUserId = dbUser.id
    }
    
    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Get user's points
    const { data: userRewards, error: userError } = await supabase
      .from('user_rewards')
      .select('points')
      .eq('user_id', dbUserId)
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    if (!userRewards || userRewards.points < reward.points_cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Generate unique code
    const code = `KINKER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Deduct points and create redemption
    const newPoints = userRewards.points - reward.points_cost
    
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq('user_id', dbUserId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: dbUserId,
        reward_id,
        points_used: reward.points_cost,
        code,
        status: 'active',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days expiry
      })
      .select()
      .single()

    if (redemptionError) {
      // Rollback points
      await supabase
        .from('user_rewards')
        .update({ points: userRewards.points })
        .eq('user_id', dbUserId)
      return NextResponse.json({ error: redemptionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      redemption,
      remainingPoints: newPoints
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
