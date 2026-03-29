import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Add 10 points for daily login
    const { data: userRewards } = await supabase
      .from('user_rewards')
      .select('id, points, lifetime_points, last_login_reward')
      .eq('user_id', user.id)
      .single()
    
    const today = new Date().toISOString().split('T')[0]
    const lastRewardDate = userRewards?.last_login_reward 
      ? new Date(userRewards.last_login_reward).toISOString().split('T')[0]
      : null
    
    // Only award points once per day
    if (lastRewardDate !== today) {
      if (userRewards) {
        await supabase
          .from('user_rewards')
          .update({
            points: (userRewards.points || 0) + 10,
            lifetime_points: (userRewards.lifetime_points || 0) + 10,
            last_login_reward: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userRewards.id)
      } else {
        // Create rewards record if not exists
        await supabase
          .from('user_rewards')
          .insert({
            user_id: user.id,
            points: 10,
            lifetime_points: 10,
            last_login_reward: new Date().toISOString()
          })
      }
    }

    // Set session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user'
    }

    cookies().set('user_session', JSON.stringify(sessionData), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
