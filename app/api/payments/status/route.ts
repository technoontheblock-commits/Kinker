import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/payments/status?orderId=xxx - Check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, status, paid_at, total')
      .eq('id', orderId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
      paidAt: order.paid_at,
      total: order.total,
      isPaid: order.payment_status === 'paid'
    })
  } catch (error: any) {
    console.error('Payment status check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
