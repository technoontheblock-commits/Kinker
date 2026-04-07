import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
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
      .select('*')
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
  } catch (error) {
    console.error('Error handling successful payment:', error)
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
      .select('*')
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
