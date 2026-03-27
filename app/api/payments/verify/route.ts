import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to check if user is admin
async function isAdmin() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) return false
  
  try {
    const session = JSON.parse(sessionCookie)
    return session.user?.role === 'admin' || session.user?.role === 'staff'
  } catch {
    return false
  }
}

// POST /api/payments/verify - Verify a payment (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin权限
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, payment_method, notes } = body

    if (!order_id || !payment_method) {
      return NextResponse.json({ error: 'Order ID and payment method required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update order payment status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date().toISOString(),
        payment_reference: notes || `Verified by admin - ${payment_method}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single()

    if (error) {
      console.error('Payment verification error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/payment-confirmed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Payment verified successfully'
    })
  } catch (error: any) {
    console.error('Payment verification exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
