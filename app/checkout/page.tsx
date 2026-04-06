'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>({ items: [], subtotal: 0, total: 0, discountAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
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

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
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
      // Stripe checkout will be implemented here
      // For now, just show a message
      alert('Stripe checkout coming soon!')
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

          {/* Right: Customer Details */}
          <div>
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
                    Jetzt bezahlen
                    <CreditCard className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
