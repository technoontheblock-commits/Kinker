'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Check, MapPin, Home, Truck } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>({ items: [], subtotal: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [sameAddress, setSameAddress] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_method: 'twint',
    // Billing Address
    billing_street: '',
    billing_city: '',
    billing_zip: '',
    billing_country: 'Schweiz',
    // Shipping Address
    shipping_street: '',
    shipping_city: '',
    shipping_zip: '',
    shipping_country: 'Schweiz'
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

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const shippingAddress = sameAddress ? {
      street: formData.billing_street,
      city: formData.billing_city,
      zip: formData.billing_zip,
      country: formData.billing_country
    } : {
      street: formData.shipping_street,
      city: formData.shipping_city,
      zip: formData.shipping_zip,
      country: formData.shipping_country
    }
    
    try {
      console.log('Submitting order...', { cart, formData })
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          payment_method: formData.payment_method,
          billing_address: {
            street: formData.billing_street,
            city: formData.billing_city,
            zip: formData.billing_zip,
            country: formData.billing_country
          },
          shipping_address: shippingAddress
        })
      })
      
      const data = await response.json()
      console.log('Checkout response:', response.status, data)
      
      if (response.ok) {
        setOrderData(data)
        setOrderComplete(true)
      } else {
        alert('Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Netzwerkfehler beim Checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl p-8 text-center"
          >
            <Check className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Bestellung erfolgreich!</h1>
            <p className="text-white/60 mb-6">
              Bestellnummer: <span className="text-white font-mono">{orderData?.order?.order_number}</span>
            </p>
            
            {orderData?.tickets?.length > 0 && (
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <p className="text-white/80">Deine Tickets wurden per E-Mail gesendet.</p>
              </div>
            )}
            
            <Link href="/" className="inline-block px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg">
              Zurück zur Startseite
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <form onSubmit={submitOrder} className="space-y-6">
            {/* Contact */}
            <div className="bg-neutral-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Kontaktdaten
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                  placeholder="Vollständiger Name"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                  placeholder="E-Mail Adresse"
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                  placeholder="Telefon (optional)"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-neutral-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Rechnungsadresse
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={formData.billing_street}
                  onChange={(e) => setFormData({ ...formData, billing_street: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                  placeholder="Strasse und Hausnummer"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={formData.billing_zip}
                    onChange={(e) => setFormData({ ...formData, billing_zip: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                    placeholder="PLZ"
                  />
                  <input
                    type="text"
                    required
                    value={formData.billing_city}
                    onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                    placeholder="Ort"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={formData.billing_country}
                  onChange={(e) => setFormData({ ...formData, billing_country: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                  placeholder="Land"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-neutral-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 shrink-0">
                  <Truck className="w-5 h-5" />
                  Lieferadresse
                </h2>
                <label className="flex items-center gap-2 text-white/60 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20"
                  />
                  <span className="text-sm whitespace-nowrap">Gleich wie Rechnungsadresse</span>
                </label>
              </div>
              
              {!sameAddress && (
                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    value={formData.shipping_street}
                    onChange={(e) => setFormData({ ...formData, shipping_street: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                    placeholder="Strasse und Hausnummer"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={formData.shipping_zip}
                      onChange={(e) => setFormData({ ...formData, shipping_zip: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                      placeholder="PLZ"
                    />
                    <input
                      type="text"
                      required
                      value={formData.shipping_city}
                      onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                      placeholder="Ort"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.shipping_country}
                    onChange={(e) => setFormData({ ...formData, shipping_country: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
                    placeholder="Land"
                  />
                </div>
              )}
            </div>
            
            {/* Payment */}
            <div className="bg-neutral-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Zahlung</h2>
              
              <div className="space-y-3">
                {['twint', 'bank_transfer', 'cash'].map((method) => (
                  <label key={method} className="flex items-center gap-3 p-4 bg-black/30 rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={formData.payment_method === method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-4 h-4 text-red-500"
                    />
                    <span className="text-white capitalize">
                      {method === 'twint' ? 'TWINT' : method === 'bank_transfer' ? 'Banküberweisung' : 'Bar vor Ort'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting || cart.items.length === 0}
              className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-white/10 text-white font-semibold rounded-lg"
            >
              {submitting ? 'Wird verarbeitet...' : `Bestellung aufgeben - CHF ${cart.subtotal?.toFixed(2)}`}
            </button>
          </form>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-neutral-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Bestellübersicht
              </h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-black/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {item.product?.name || item.event_ticket?.name}
                      </p>
                      {item.selected_size && (
                        <p className="text-white/60 text-sm">Grösse: {item.selected_size}</p>
                      )}
                      <p className="text-white/40 text-sm">Menge: {item.quantity}</p>
                    </div>
                    <p className="text-white font-semibold">
                      CHF {((item.product?.price || item.event_ticket?.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-white/60">
                  <span>Zwischensumme</span>
                  <span>CHF {cart.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Versand</span>
                  <span>Kostenlos</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                  <span>Gesamt</span>
                  <span>CHF {cart.subtotal?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
