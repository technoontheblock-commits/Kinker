import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createPrintfulOrder } from '@/lib/printful'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  })
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = getStripe().webhooks.constructEvent(payload, signature, getWebhookSecret())
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('PaymentIntent was successful:', paymentIntent.id)
        
        // Update order status in database
        await handleSuccessfulPayment(supabase, paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        
        await handleFailedPayment(supabase, failedPayment)
        break

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        
        await handleCheckoutCompleted(supabase, session)
        break

      // Handle SEPA and other async payment methods
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge
        console.log('Charge succeeded:', charge.id)
        
        if (charge.payment_intent) {
          await handleChargeSucceeded(supabase, charge)
        }
        break

      case 'charge.failed':
        const failedCharge = event.data.object as Stripe.Charge
        console.log('Charge failed:', failedCharge.id)
        
        if (failedCharge.payment_intent) {
          await handleChargeFailed(supabase, failedCharge)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleSuccessfulPayment(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find order by payment intent ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_reference', paymentIntent.id)
      .single()

    if (error || !order) {
      console.error('Order not found for payment intent:', paymentIntent.id)
      return
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    console.log(`Order ${order.order_number} marked as paid`)

    // Forward to Printful if order contains merchandise
    await forwardToPrintful(supabase, order)
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function forwardToPrintful(supabase: any, order: any) {
  try {
    // Check if Printful is configured
    if (!process.env.PRINTFUL_API_TOKEN) {
      console.log('Printful not configured, skipping fulfillment')
      return
    }

    // Get shipping address from Stripe checkout session
    const { data: sessionData } = await getStripe().checkout.sessions.list({
      payment_intent: order.payment_reference,
      limit: 1,
    })
    const session = sessionData?.[0]

    const shipping = (session as any)?.shipping_details || (session as any)?.shipping
    const address = shipping?.address

    if (!shipping) {
      console.log('No shipping details found, skipping Printful')
      return
    }

    // Get merchandise items from order
    const merchItems = order.order_items?.filter((item: any) =>
      item.product_id && !item.is_ticket && !item.is_vip
    ) || []

    if (merchItems.length === 0) {
      console.log('No merchandise items, skipping Printful')
      return
    }

    // Build Printful items from order_items metadata
    const items = []
    for (const item of merchItems) {
      const variantId = item.metadata?.printful_variant_id
      if (variantId) {
        items.push({
          variant_id: variantId,
          quantity: item.quantity,
          retail_price: String(item.price),
          name: item.name,
        })
      }
    }

    if (items.length === 0) {
      console.log('No Printful variants in order items, skipping')
      return
    }

    // Create Printful order
    const pfOrder = await createPrintfulOrder({
      external_id: order.order_number,
      shipping: 'STANDARD',
      recipient: {
        name: shipping.name || order.customer_name || '',
        address1: address?.line1 || '',
        city: address?.city || '',
        country_code: address?.country || 'CH',
        zip: address?.postal_code || '',
        email: order.customer_email || '',
        phone: order.customer_phone || '',
        state_code: address?.state || undefined,
        address2: address?.line2 || undefined,
      },
      items,
    })

    // Save Printful order reference
    await supabase
      .from('orders')
      .update({
        printful_order_id: String(pfOrder.data?.id),
        printful_status: pfOrder.data?.status,
      })
      .eq('id', order.id)

    await supabase
      .from('printful_orders')
      .insert({
        order_id: order.id,
        printful_order_id: pfOrder.data?.id,
        printful_external_id: order.order_number,
        status: pfOrder.data?.status || 'pending',
      })

    console.log(`Order ${order.order_number} forwarded to Printful: ${pfOrder.data?.id}`)
  } catch (error: any) {
    console.error('Printful forwarding error:', error.message)
  }
}

async function handleFailedPayment(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
      })
      .eq('payment_reference', paymentIntent.id)

    console.log(`Payment ${paymentIntent.id} marked as failed`)
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  try {
    // Update order with Stripe session info
    await supabase
      .from('orders')
      .update({
        payment_reference: session.payment_intent as string,
        stripe_session_id: session.id,
      })
      .eq('order_number', session.metadata?.order_number)

    console.log(`Checkout session ${session.id} completed`)
  } catch (error) {
    console.error('Error handling checkout completion:', error)
  }
}

async function handleChargeSucceeded(supabase: any, charge: Stripe.Charge) {
  try {
    // Find order by payment intent ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_reference', charge.payment_intent as string)
      .single()

    if (error || !order) {
      console.error('Order not found for charge:', charge.id)
      return
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    console.log(`Order ${order.order_number} marked as paid via charge`)

    // Forward to Printful
    await forwardToPrintful(supabase, order)
  } catch (error) {
    console.error('Error handling charge success:', error)
  }
}

async function handleChargeFailed(supabase: any, charge: Stripe.Charge) {
  try {
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
      })
      .eq('payment_reference', charge.payment_intent as string)

    console.log(`Charge ${charge.id} marked as failed`)
  } catch (error) {
    console.error('Error handling charge failure:', error)
  }
}
