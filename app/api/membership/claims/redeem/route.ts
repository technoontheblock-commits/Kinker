import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { generateCardNumber, generateBonusCardToken } from '@/lib/bonuscard'
import { createSignedSession, setSessionCookie, getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { token, holder_name, holder_email, auth_mode, email, password, name, newsletter } = body

    if (!token || !holder_name || !holder_email) {
      return NextResponse.json({ error: 'Token, holder name and email are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate token
    const { data: claim, error: claimError } = await supabase
      .from('membership_claims')
      .select('*')
      .eq('token', token)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (claim.claimed_at) {
      return NextResponse.json({ error: 'Token already redeemed' }, { status: 400 })
    }

    if (new Date(claim.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    let userId: string | null = null

    // Check if already logged in
    const currentUser = getCurrentUser()
    if (currentUser) {
      userId = currentUser.id
    } else if (auth_mode === 'existing') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, password_hash, status, email_verified')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      if (user.status !== 'active') {
        return NextResponse.json({ error: 'Account inactive' }, { status: 403 })
      }

      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      userId = user.id

      // Create session
      const sessionUser = {
        id: user.id,
        email: user.email,
        name: '', // will be filled from profile if needed
        role: 'user',
        type: 'user' as const,
      }
      setSessionCookie(sessionUser)
    } else if (auth_mode === 'new') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
      }

      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password_hash: hashedPassword,
          role: 'user',
          status: 'active',
          email_verified: true,
        }])
        .select()
        .single()

      if (createError || !newUser) {
        console.error('User creation error:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      userId = newUser.id

      // Create related records
      await supabase.from('user_profiles').insert([{
        user_id: newUser.id,
        newsletter_opt_in: newsletter === true,
      }])

      await supabase.from('user_wallets').insert([{
        user_id: newUser.id,
        balance: 0,
      }])

      await supabase.from('user_rewards').insert([{
        user_id: newUser.id,
        points: 0,
        lifetime_points: 0,
        tier: 'Bronze',
      }])

      if (newsletter === true) {
        await supabase.from('newsletter_subscribers').upsert([{
          email: email.trim().toLowerCase(),
          name: name.trim(),
          subscribed: true,
        }], { onConflict: 'email' })
      }

      // Create session
      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'user',
        type: 'user' as const,
      }
      setSessionCookie(sessionUser)
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 500 })
    }

    // Generate card number and token
    const cardNumber = await generateCardNumber(supabase)
    const qrToken = generateBonusCardToken()

    // Create bonus card (auto-confirmed / paid)
    const { data: bonusCard, error: cardError } = await supabase
      .from('bonus_cards')
      .insert([{
        user_id: userId,
        card_number: cardNumber,
        qr_token: qrToken,
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        purchase_price: 0,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'active',
        paid_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single()

    if (cardError || !bonusCard) {
      console.error('Bonus card creation error:', cardError)
      return NextResponse.json({ error: 'Failed to create membership card' }, { status: 500 })
    }

    // Mark claim as redeemed
    const { error: updateError } = await supabase
      .from('membership_claims')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId,
        bonus_card_id: bonusCard.id,
      })
      .eq('id', claim.id)

    if (updateError) {
      console.error('Claim update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      card: {
        id: bonusCard.id,
        card_number: cardNumber,
        view_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'}/membership/card/${qrToken}`,
      },
    })
  } catch (error) {
    console.error('Membership claim redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
