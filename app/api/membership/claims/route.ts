import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { requireAdmin, getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function generateClaimToken(): string {
  return randomBytes(32).toString('hex')
}

// POST /api/membership/claims - Create a new claim token (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { authorized, user } = await requireAdmin()
    if (!authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = generateClaimToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('membership_claims')
      .insert([{
        token,
        expires_at: expiresAt,
        created_by_admin_id: user?.id,
      }])
      .select()
      .single()

    if (error || !data) {
      console.error('Create claim error:', error)
      return NextResponse.json({ error: 'Claim could not be created' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: data.id,
        token: data.token,
        expires_at: data.expires_at,
        claim_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'}/membership/claim?token=${data.token}`,
      },
    })
  } catch (error) {
    console.error('Membership claim creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/membership/claims - List all claims (admin only) or validate a single token (public)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Public token validation
    if (token) {
      const { data, error } = await supabase
        .from('membership_claims')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) {
        return NextResponse.json({ valid: false, error: 'Token not found' }, { status: 404 })
      }

      const now = new Date().toISOString()
      if (data.claimed_at) {
        return NextResponse.json({ valid: false, error: 'Token already redeemed' })
      }
      if (data.expires_at < now) {
        return NextResponse.json({ valid: false, error: 'Token expired' })
      }

      return NextResponse.json({ valid: true, claim: data })
    }

    // Admin list all claims
    const { authorized } = await requireAdmin()
    if (!authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('membership_claims')
      .select('*, bonus_cards(card_number, holder_name, holder_email), claimed_by:claimed_by_user_id(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('List claims error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Membership claim GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
