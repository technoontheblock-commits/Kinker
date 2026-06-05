import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle, AlertCircle, ArrowLeft, FileText } from 'lucide-react'
import { getSumUp } from '@/lib/sumup'
import { createClient } from '@supabase/supabase-js'
import { verifySignedSession } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function CheckoutSuccessPage() {
  const cookieStore = cookies()
  const checkoutId = cookieStore.get('sumup_checkout_id')?.value
  const sessionId = cookieStore.get('session_id')?.value

  const userSession = cookieStore.get('user_session')?.value
  const loggedInUser = userSession ? verifySignedSession(userSession) : null
  const customerName = loggedInUser?.name || 'Guest'
  const customerEmail = loggedInUser?.email || 'guest@kinker.ch'

  if (!checkoutId) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ungültige Anfrage</h1>
          <p className="text-white/60 mb-6">Keine Checkout-ID gefunden.</p>
          <Link href="/merch" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400">
            <ArrowLeft className="w-4 h-4" />Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }

  try {
    const sumup = getSumUp()
    const checkout = await sumup.checkouts.get(checkoutId)

    if (checkout.status !== 'PAID') {
      return (
        <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Zahlungsstatus unklar</h1>
            <p className="text-white/60 mb-6">Status: {checkout.status}. Bitte kontaktiere uns, falls du Hilfe benötigst.</p>
            <Link href="/merch" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400">
              <ArrowLeft className="w-4 h-4" />Zurück zum Shop
            </Link>
          </div>
        </div>
      )
    }

    let order: { id: string; order_number: string } | null = null
    let orderItems: any[] = []
    let creationError = ''

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      try {
        // Check if order already exists for this checkout
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('payment_reference', checkoutId)
          .maybeSingle()

        if (existingOrder) {
          order = existingOrder
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
          orderItems = items || []
        } else {
          const orderNumber = checkout.checkout_reference || `KINKER-SUMUP-${Date.now()}`
          const amount = checkout.amount || 0

          // Try to create order from cart first
          let cartCreated = false
          if (sessionId) {
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select(`*, product:merchandise(*), event_ticket:event_tickets(*, event:events(*))`)
              .eq('session_id', sessionId)

            if (cartItems && cartItems.length > 0) {
              let subtotal = 0
              const itemsToInsert = cartItems.map((item: any) => {
                const isTicket = !!item.event_ticket
                const price = isTicket ? item.event_ticket.price : item.product?.price ?? 0
                const name = isTicket ? item.event_ticket.name : item.product?.name ?? 'Unknown'
                subtotal += price * item.quantity
                return {
                  product_id: item.product_id,
                  event_ticket_id: item.event_ticket_id,
                  name: name,
                  price: price,
                  quantity: item.quantity,
                  selected_size: item.selected_size,
                  is_ticket: isTicket,
                  event_id: isTicket ? item.event_ticket.event_id : null,
                }
              })

              const { data: createdOrder, error: orderError } = await supabase
                .from('orders')
                .insert([{
                  order_number: orderNumber,
                  customer_email: customerEmail,
                  customer_name: customerName,
                  payment_method: 'bank_transfer',
                  payment_status: 'paid',
                  payment_reference: checkoutId,
                  subtotal: subtotal,
                  total: subtotal,
                  status: 'completed',
                  paid_at: new Date().toISOString(),
                }])
                .select()
                .single()

              if (!orderError && createdOrder) {
                order = createdOrder
                cartCreated = true

                const { data: createdItems } = await supabase
                  .from('order_items')
                  .insert(itemsToInsert.map((item: any) => ({ ...item, order_id: createdOrder.id })))
                  .select()

                orderItems = createdItems || []
                await supabase.from('cart_items').delete().eq('session_id', sessionId)
              } else if (orderError) {
                creationError = `Order insert error: ${orderError.message}`
                console.error('[SumUp Success] Order insert error:', orderError)
              }
            }
          }

          // Fallback: create minimal order even if no cart items
          if (!cartCreated && !order) {
            const { data: createdOrder, error: orderError } = await supabase
              .from('orders')
              .insert([{
                order_number: orderNumber,
                customer_email: customerEmail,
                customer_name: customerName,
                payment_method: 'bank_transfer',
                payment_status: 'paid',
                payment_reference: checkoutId,
                subtotal: amount,
                total: amount,
                status: 'completed',
                paid_at: new Date().toISOString(),
              }])
              .select()
              .single()

            if (!orderError && createdOrder) {
              order = createdOrder
            } else if (orderError) {
              creationError = `Minimal order insert error: ${orderError.message}`
              console.error('[SumUp Success] Minimal order insert error:', orderError)
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        creationError = `Exception: ${msg}`
        console.error('[SumUp Success] Order creation exception:', err)
      }
    } else {
      creationError = 'Supabase not configured'
    }

    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Zahlung erfolgreich!</h1>
          <p className="text-white/60 mb-2">Vielen Dank für deine Bestellung bei KINKER.</p>

          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left text-sm space-y-1">
            <div className="flex justify-between"><span className="text-white/60">Referenz:</span><span className="text-white font-mono">{checkout.checkout_reference}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Betrag:</span><span className="text-white">{checkout.amount?.toFixed(2)} {checkout.currency}</span></div>
            {checkout.transactions?.[0]?.transaction_code && (
              <div className="flex justify-between"><span className="text-white/60">Transaktion:</span><span className="text-white font-mono">{checkout.transactions[0].transaction_code}</span></div>
            )}
            {order && (
              <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                <span className="text-white/60">Bestellnummer:</span>
                <span className="text-white font-mono">{order.order_number}</span>
              </div>
            )}
            {orderItems.length > 0 && (
              <div className="pt-2 border-t border-white/10 mt-2">
                <p className="text-white/60 text-xs mb-1">Artikel:</p>
                {orderItems.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white">{item.name} x{item.quantity}</span>
                    <span className="text-white">CHF {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {creationError && (
              <div className="pt-2 border-t border-red-500/20 mt-2">
                <p className="text-red-500 text-xs">Order creation: {creationError}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/merch" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
              <ArrowLeft className="w-4 h-4" />Weiter einkaufen
            </Link>
            <Link href="/dashboard/orders" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors">
              <FileText className="w-4 h-4" />Order Übersicht
            </Link>
          </div>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Verifizierung fehlgeschlagen</h1>
          <p className="text-white/60 mb-6">Die Zahlung konnte nicht verifiziert werden. Falls du eine Bestätigungsmail erhalten hast, ist alles in Ordnung.</p>
          <Link href="/merch" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400">
            <ArrowLeft className="w-4 h-4" />Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }
}
