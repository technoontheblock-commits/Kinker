import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function getCurrentUser(supabase: any, request?: NextRequest) {
  // Try to get from cookie - either from request headers or cookies()
  let session = null
  
  if (request) {
    // Try to get from request cookies
    session = request.cookies.get('user_session')?.value
  }
  
  // Fallback to cookies()
  if (!session) {
    session = cookies().get('user_session')?.value
  }
  
  if (session) {
    try {
      const user = JSON.parse(session)
      // Verify user still exists in DB
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', user.id)
        .single()
      if (dbUser) return dbUser
    } catch {
      // Invalid session
    }
  }
  return null
}

const TIERS = [
  { name: 'Bronze', min: 0, multiplier: 1 },
  { name: 'Silver', min: 500, multiplier: 1.2 },
  { name: 'Gold', min: 1500, multiplier: 1.5 },
  { name: 'Platinum', min: 5000, multiplier: 2 }
]

// GET /api/rewards - Get user's rewards and available rewards
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const user = await getCurrentUser(supabase, request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Use the verified user ID from database
    const dbUserId = user.id
    
    // Get or create rewards record
    let { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', dbUserId)
      .single()
    
    // If no record found or error, try to create one
    if (!rewards || rewardsError) {
      const insertData: any = { 
        user_id: dbUserId, 
        points: 0,
        lifetime_points: 0
      }
      
      const { data: newRewards, error: insertError } = await supabase
        .from('user_rewards')
        .insert(insertData)
        .select()
        .single()
      
      if (insertError) {
        // If duplicate key error, try to fetch existing record again
        if (insertError.message?.includes('duplicate key')) {
          const { data: existingRewards } = await supabase
            .from('user_rewards')
            .select('*')
            .eq('user_id', dbUserId)
            .single()
          if (existingRewards) {
            rewards = existingRewards
          } else {
            return NextResponse.json({ error: 'Failed to fetch rewards record' }, { status: 500 })
          }
        } else {
          console.error('Error creating rewards record:', insertError)
          return NextResponse.json({ 
            error: 'Failed to create rewards record: ' + insertError.message
          }, { status: 500 })
        }
      } else {
        rewards = newRewards
      }
    }
    
    // Calculate tier
    const tier = TIERS.slice().reverse().find(t => (rewards?.lifetime_points || 0) >= t.min) || TIERS[0]
    const nextTier = TIERS.find(t => t.min > (rewards?.lifetime_points || 0))
    
    // Get available rewards
    const { data: availableRewards, error: availableRewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .lte('points_cost', rewards?.points || 0)
      .order('points_cost', { ascending: true })

    if (availableRewardsError) {
      return NextResponse.json({ error: availableRewardsError.message }, { status: 500 })
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
    
    // Get points history (if table exists)
    let pointsHistory: any[] = []
    const { data: ph, error: phError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (!phError && ph) {
      pointsHistory = ph
    }

    return NextResponse.json({
      points: rewards?.points || 0,
      lifetimePoints: rewards?.lifetime_points || 0,
      tier: tier.name,
      multiplier: tier.multiplier,
      nextTier,
      availableRewards: availableRewards || [],
      allRewards: allRewards || [],
      history: history || [],
      pointsHistory: pointsHistory || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/rewards - Redeem a reward
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const user = await getCurrentUser(supabase, request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { reward_id } = body

    if (!reward_id) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 })
    }
    
    // Use the verified user ID from database
    const dbUserId = user.id
    
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
