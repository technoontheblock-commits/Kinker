import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSessionId(): string {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = randomUUID()
    cookieStore.set('session_id', sessionId, { 
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })
  }
  
  return sessionId
}

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  return JSON.parse(session)
}

// POST /api/cart/discount - Apply discount code
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const { code } = body
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const sessionId = getSessionId()
    const user = getCurrentUser()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if it's a reward redemption code (KINKER-XXX)
    if (code.startsWith('KINKER-')) {
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
        return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
      }

      // Check if already used
      if (redemption.status === 'used') {
        return NextResponse.json({ error: 'Code already used' }, { status: 400 })
      }

      // Check if expired
      if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Code expired' }, { status: 400 })
      }

      // Store discount in session cookie
      const discountData = {
        code,
        type: redemption.rewards.reward_type,
        value: redemption.rewards.reward_value,
        redemption_id: redemption.id,
        name: redemption.rewards.name
      }

      cookies().set('cart_discount', JSON.stringify(discountData), {
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      })

      return NextResponse.json({
        success: true,
        discount: {
          code,
          name: redemption.rewards.name,
          type: redemption.rewards.reward_type,
          value: redemption.rewards.reward_value
        }
      })
    }

    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
  } catch (error: any) {
    console.error('Apply discount error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/cart/discount - Remove discount
export async function DELETE() {
  try {
    cookies().delete('cart_discount')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/cart/discount - Get current discount
export async function GET() {
  try {
    const discountCookie = cookies().get('cart_discount')?.value
    if (!discountCookie) {
      return NextResponse.json({ discount: null })
    }

    const discount = JSON.parse(discountCookie)
    return NextResponse.json({ discount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
