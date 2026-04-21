import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const dynamic = 'force-dynamic'

// POST /api/printful/webhook - Handle Printful webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const secret = request.headers.get('X-PF-Webhook-Signature')

    // Basic validation
    if (!body || !body.type) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (body.type) {
      case 'order_updated':
      case 'package_shipped': {
        const orderData = body.data
        const printfulOrderId = orderData.id

        // Update local printful_orders
        await supabase
          .from('printful_orders')
          .update({
            status: orderData.status,
            shipping_carrier: orderData.shipments?.[0]?.carrier,
            shipping_number: orderData.shipments?.[0]?.tracking_number,
            tracking_url: orderData.shipments?.[0]?.tracking_url,
            updated_at: new Date().toISOString(),
          })
          .eq('printful_order_id', printfulOrderId)

        // Also update orders table if linked
        await supabase
          .from('orders')
          .update({
            printful_status: orderData.status,
            printful_tracking_url: orderData.shipments?.[0]?.tracking_url,
            printful_shipping_carrier: orderData.shipments?.[0]?.carrier,
            printful_shipping_number: orderData.shipments?.[0]?.tracking_number,
          })
          .eq('printful_order_id', String(printfulOrderId))

        break
      }

      default:
        console.log('Unhandled Printful webhook type:', body.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Printful webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
