'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

// SumUp Card Widget Types
declare global {
  interface Window {
    SumUpCard?: any
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>({ items: [], subtotal: 0, total: 0, discountAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  // SumUp Card Widget uses ID 'sumup-card' instead of ref
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zip: '',
    country: 'Schweiz'
  })

  useEffect(() => {
    loadCart()
  }, [])

  // Poll order status when checkout is created
  useEffect(() => {
    if (checkoutId && orderNumber && !paymentSuccess) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders?orderNumber=${orderNumber}`)
          if (res.ok) {
            const order = await res.json()
            if (order.payment_status === 'paid') {
              setPaymentSuccess(true)
              clearInterval(interval)
              // Only redirect after order is confirmed paid in database
              window.location.href = `/checkout/success?order=${orderNumber}&checkout_id=${checkoutId}`
            }
          }
          setPollCount(c => c + 1)
          // Stop polling after 10 minutes (120 * 5s = 600s)
          if (pollCount > 120) {
            clearInterval(interval)
          }
        } catch (err) {
          console.error('Error polling order status:', err)
        }
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [checkoutId, orderNumber, paymentSuccess, pollCount])

  // Initialize SumUp Card Widget when checkoutId is available
  useEffect(() => {
    if (checkoutId && window.SumUpCard) {
      try {
        const card = window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: checkoutId,
          showErrorDetails: true, // Show detailed error messages
          onResponse: (response: any) => {
            console.log('SumUp response:', JSON.stringify(response, null, 2))
            
            // SumUp API returns strings like "sent", "auth-screen", "success", "failed"
            const responseStr = typeof response === 'string' ? response : response.status || response.transaction_code
            
            // Check for various success statuses
            // NOTE: We don't redirect immediately on success - we wait for the 
            // order status to be updated via polling to ensure the payment is 
            // actually complete and verified on our backend
            const successStatuses = ['PAID', 'SUCCESS', 'COMPLETED', 'CAPTURED', 'success']
            const failedStatuses = ['FAILED', 'CANCELLED', 'DECLINED', 'ERROR', 'failed']
            
            if (successStatuses.includes(responseStr)) {
              console.log('Payment reported successful by SumUp widget, waiting for order confirmation...')
              // Don't redirect here - let the polling confirm the order is paid
              // The polling useEffect will redirect when order.payment_status === 'paid'
              setVerifyingPayment(true)
            } else if (failedStatuses.includes(responseStr)) {
              console.log('Payment failed:', responseStr)
              
              // Build detailed error message based on status
              let errorDetail = ''
              switch(responseStr) {
                case 'FAILED':
                  errorDetail = 'Die Transaktion wurde von der Bank abgelehnt. Mögliche Gründe:\n• Ungültige Kreditkartennummer\n• Nicht genügend Guthaben\n• Karte wurde von der Bank gesperrt\n• 3D Secure Authentifizierung fehlgeschlagen'
                  break
                case 'DECLINED':
                  errorDetail = 'Die Zahlung wurde vom Kartenherausgeber abgelehnt.\nBitte kontaktiere deine Bank oder verwende eine andere Karte.'
                  break
                case 'CANCELLED':
                  errorDetail = 'Die Zahlung wurde abgebrochen.'
                  break
                case 'ERROR':
                  errorDetail = 'Ein technischer Fehler ist aufgetreten.\nBitte versuche es in wenigen Minuten erneut.'
                  break
                default:
                  errorDetail = `Status: ${responseStr}`
              }
              
              setError(errorDetail)
            } else if (responseStr === 'sent' || responseStr === 'auth-screen') {
              console.log('Payment in progress:', responseStr)
            } else {
              console.log('Unknown payment status:', responseStr)
            }
          },
          onError: (error: any) => {
            console.error('SumUp error:', error)
            const errorMsg = typeof error === 'string' ? error : error.message || JSON.stringify(error)
            setError(`Technischer Fehler: ${errorMsg}\n\nBitte versuche es erneut oder verwende eine andere Zahlungsmethode.`)
          }
        })

        return () => {
          card.unmount()
        }
      } catch (err) {
        console.error('Error mounting SumUp widget:', err)
        setError('Fehler beim Laden des Zahlungsformulars.')
      }
    }
  }, [checkoutId])

  const loadCart = async () => {
    try {
      console.log('Loading cart...')
      const response = await fetch('/api/cart')
      console.log('Cart response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Cart data:', data)
        setCart(data)
      } else {
        const error = await response.json()
        console.error('Cart error:', error)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/sumup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          shipping_address: {
            street: formData.street,
            city: formData.city,
            zip: formData.zip,
            country: formData.country
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.sumup?.checkout_id) {
        // Store checkout ID for the SumUp Card Widget
        setCheckoutId(data.sumup.checkout_id)
        setOrderNumber(data.order?.order_number || '')
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to create checkout'
        console.error('Checkout error:', errorMsg, data)
        setError(errorMsg)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-white mb-4">Zahlung erfolgreich!</h1>
          <p className="text-white/60 text-lg mb-2">Vielen Dank für deine Bestellung bei KINKER Basel.</p>
          
          {orderNumber && (
            <p className="text-white/40 mb-8">
              Bestellnummer: <span className="text-white font-mono">{orderNumber}</span>
            </p>
          )}

          <p className="text-white/60 mb-8">
            Du erhältst eine Bestätigungs-E-Mail mit deinen Tickets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/orders"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Meine Bestellungen
            </Link>
            <Link
              href="/events"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
            >
              Weitere Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Warenkorb ist leer</h1>
          <Link href="/merch" className="text-red-500 hover:text-red-400">
            Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load SumUp Card Widget SDK */}
      <Script
        src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
        strategy="lazyOnload"
        onLoad={() => console.log('SumUp SDK loaded')}
      />
      
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Order Summary */}
            <div>
              <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Bestellübersicht</h2>
                
                <div className="space-y-4">
                  {cart.items.map((item: any) => {
                    // Determine item type and details
                    let itemName = ''
                    let itemPrice = 0
                    let itemDetails = ''
                    
                    if (item.product?.name) {
                      itemName = item.product.name
                      itemPrice = item.product.price
                    } else if (item.event_ticket?.name) {
                      itemName = item.event_ticket.name
                      itemPrice = item.event_ticket.price
                    } else if (item.vip_booking_id || item.metadata?.type === 'vip_booking') {
                      itemName = `VIP ${item.metadata?.package || item.selected_size} Package`
                      itemPrice = item.metadata?.price || 0
                      itemDetails = item.metadata?.event_name || ''
                    }
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <div>
                          <p className="text-white font-medium">{itemName}</p>
                          {item.selected_size && !item.vip_booking_id && (
                            <p className="text-zinc-500 text-sm">Größe: {item.selected_size}</p>
                          )}
                          {itemDetails && (
                            <p className="text-zinc-500 text-sm">{itemDetails}</p>
                          )}
                          <p className="text-zinc-500 text-sm">Menge: {item.quantity}</p>
                        </div>
                        <p className="text-white">CHF {(itemPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Zwischensumme</span>
                    <span>CHF {cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Rabatt</span>
                      <span>-CHF {cart.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Gesamt</span>
                    <span>CHF {cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Customer Details or Payment Widget */}
            <div>
              {!checkoutId ? (
                <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Kundendaten
                  </h2>
                  
                  {error && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">E-Mail *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">Telefon</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-zinc-400 text-sm mb-2">Strasse *</label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({...formData, street: e.target.value})}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 text-sm mb-2">PLZ *</label>
                        <input
                          type="text"
                          required
                          value={formData.zip}
                          onChange={(e) => setFormData({...formData, zip: e.target.value})}
                          className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-sm mb-2">Ort *</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        Weiter zur Zahlung
                        <CreditCard className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-zinc-900 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Kreditkarte
                  </h2>
                  
                  {error && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                      <button
                        onClick={() => {
                          setError('')
                          setCheckoutId(null)
                        }}
                        className="text-red-400 hover:text-red-300 underline text-sm mt-2"
                      >
                        Zurück zu den Kundendaten
                      </button>
                    </div>
                  )}
                  
                  <div className="text-center py-4">
                    <p className="text-zinc-400 mb-4">Zu zahlen: <span className="text-white font-bold text-xl">CHF {cart.total.toFixed(2)}</span></p>
                  </div>
                  
                  {/* SumUp Card Widget Container */}
                  {error ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <p className="text-red-400 font-bold text-lg">Zahlung fehlgeschlagen</p>
                      </div>
                      <div className="text-white/80 mb-4 whitespace-pre-line">
                        {error}
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setError('')
                            window.location.reload()
                          }}
                          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        >
                          Mit neuer Karte zahlen
                        </button>
                        <button
                          onClick={() => setCheckoutId(null)}
                          className="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
                        >
                          Zurück zu den Kundendaten
                        </button>
                      </div>
                    </div>
                  ) : verifyingPayment ? (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center">
                      <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                      <p className="text-green-400 font-semibold text-lg mb-2">Zahlung wird verarbeitet...</p>
                      <p className="text-green-400/70 text-sm">Bitte warte einen Moment, während wir deine Zahlung bestätigen.</p>
                    </div>
                  ) : (
                    <div 
                      id="sumup-card"
                      className="min-h-[300px] bg-white rounded-lg p-4"
                    >
                      {!window.SumUpCard && (
                        <div className="flex items-center justify-center h-[300px]">
                          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                          <span className="ml-2 text-zinc-400">Lade Zahlungsformular...</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setCheckoutId(null)}
                      className="text-zinc-400 hover:text-white text-sm"
                    >
                      ← Zurück zu den Kundendaten
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
