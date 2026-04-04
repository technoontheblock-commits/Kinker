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

// POST /api/rewards/sync - Sync points from history
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all points history for user
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select('points_change')
      .eq('user_id', user.id)
    
    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }
    
    // Calculate total points from history
    const totalPoints = history?.reduce((sum, item) => sum + (item.points_change || 0), 0) || 0
    
    // Get redemptions (spent points)
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .select('points_used')
      .eq('user_id', user.id)
    
    const spentPoints = redemptions?.reduce((sum, item) => sum + (item.points_used || 0), 0) || 0
    
    // Calculate available points
    const availablePoints = Math.max(0, totalPoints - spentPoints)
    
    console.log('Syncing points:', { 
      userId: user.id, 
      totalEarned: totalPoints, 
      spent: spentPoints, 
      available: availablePoints 
    })
    
    // Update user_rewards
    const { data: existingRewards } = await supabase
      .from('user_rewards')
      .select('lifetime_points')
      .eq('user_id', user.id)
      .single()
    
    const currentLifetime = existingRewards?.lifetime_points || 0
    const newLifetime = Math.max(currentLifetime, totalPoints) // Don't reduce lifetime points
    
    if (existingRewards) {
      await supabase
        .from('user_rewards')
        .update({ 
          points: availablePoints,
          lifetime_points: newLifetime,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          points: availablePoints,
          lifetime_points: newLifetime,
          tier: 'Bronze'
        })
    }
    
    return NextResponse.json({
      success: true,
      synced: true,
      points: availablePoints,
      lifetimePoints: newLifetime,
      totalEarned: totalPoints,
      totalSpent: spentPoints
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
