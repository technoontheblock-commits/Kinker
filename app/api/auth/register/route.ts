import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { name, email, password, newsletter } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: 'user',
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Create user profile
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        name: name.trim(),
        newsletter_opt_in: newsletter === true
      })

    // Add to newsletter subscribers if opted in
    if (newsletter === true) {
      await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: email.toLowerCase(),
          confirmed: true,
          subscribed_at: new Date().toISOString()
        }, { onConflict: 'email' })
    }

    // Create wallet
    await supabase
      .from('user_wallets')
      .insert({
        user_id: user.id,
        balance: 0
      })

    // Create rewards record
    await supabase
      .from('user_rewards')
      .insert({
        user_id: user.id,
        points: 0,
        lifetime_points: 0,
        tier: 'Bronze'
      })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
