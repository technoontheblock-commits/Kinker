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

// GET /api/rewards/daily-login - Check daily login status
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user's rewards record
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('last_login_reward, login_streak')
      .eq('user_id', user.id)
      .single()
    
    const today = new Date().toISOString().split('T')[0]
    const lastClaimDate = rewards?.last_login_reward 
      ? new Date(rewards.last_login_reward).toISOString().split('T')[0]
      : null
    
    // Can claim if never claimed or last claim was before today
    const canClaim = !lastClaimDate || lastClaimDate !== today
    
    // Calculate streak
    let streak = rewards?.login_streak || 0
    if (lastClaimDate) {
      const lastDate = new Date(lastClaimDate)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Reset streak if missed a day
      if (lastDate.toISOString().split('T')[0] !== yesterday.toISOString().split('T')[0] && 
          lastDate.toISOString().split('T')[0] !== today) {
        streak = 0
      }
    }

    return NextResponse.json({
      canClaim,
      lastClaimDate: rewards?.last_login_reward || null,
      streak
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/rewards/daily-login - Claim daily login reward
export async function POST() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user's rewards record
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('id, points, lifetime_points, last_login_reward, login_streak')
      .eq('user_id', user.id)
      .single()
    
    const today = new Date().toISOString().split('T')[0]
    const lastClaimDate = rewards?.last_login_reward 
      ? new Date(rewards.last_login_reward).toISOString().split('T')[0]
      : null
    
    // Check if already claimed today
    if (lastClaimDate === today) {
      return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
    }
    
    // Calculate streak
    let newStreak = 1
    if (lastClaimDate) {
      const lastDate = new Date(lastClaimDate)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newStreak = (rewards?.login_streak || 0) + 1
      }
    }
    
    // Bonus points for streaks
    let bonusPoints = 10
    if (newStreak >= 7) bonusPoints = 20
    if (newStreak >= 30) bonusPoints = 50
    
    // Update rewards
    if (rewards) {
      await supabase
        .from('user_rewards')
        .update({
          points: (rewards.points || 0) + bonusPoints,
          lifetime_points: (rewards.lifetime_points || 0) + bonusPoints,
          last_login_reward: new Date().toISOString(),
          login_streak: newStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', rewards.id)
    } else {
      // Create new rewards record
      await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          points: bonusPoints,
          lifetime_points: bonusPoints,
          last_login_reward: new Date().toISOString(),
          login_streak: newStreak
        })
    }

    return NextResponse.json({
      success: true,
      pointsEarned: bonusPoints,
      streak: newStreak,
      dailyLogin: {
        canClaim: false,
        lastClaimDate: new Date().toISOString(),
        streak: newStreak
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
