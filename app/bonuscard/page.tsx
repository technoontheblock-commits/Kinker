'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, Loader2, Smartphone, Banknote, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BonusCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    holder_name: '',
    holder_email: '',
    holder_phone: '',
    payment_method: 'twint'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/bonuscard/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/bonuscard/success?card=${data.card.card_number}&url=${encodeURIComponent(data.card.view_url)}&method=${formData.payment_method}`)
      } else {
        alert(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Hero */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl mb-6"
            >
              <CreditCard className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              KINKER <span className="text-red-500">Bonuscard</span>
            </h1>
            <p className="text-white/60 text-lg">
              Deine Stammgastkarte für exklusive Preisermässigungen
            </p>
          </div>

          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="relative bg-gradient-to-br from-neutral-900 to-black rounded-2xl p-8 border border-white/10 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-red-500 font-bold text-sm tracking-wider">KINKER BASEL</p>
                    <p className="text-white/40 text-xs">STAMMGASTKARTE</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-red-500/50" />
                </div>
                
                <div className="mb-8">
                  <p className="text-white/30 text-xs mb-1">KARTENINHABER</p>
                  <p className="text-white text-xl font-medium">Max Mustermann</p>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/30 text-xs mb-1">KARTENNUMMER</p>
                    <p className="text-white font-mono text-sm">KINKER-BC-2026-000001</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/30 text-xs mb-1">PREIS</p>
                    <p className="text-red-500 font-bold text-2xl">CHF 100</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
          >
            {[
              { icon: Check, text: 'Preisermässigung an der Abendkasse' },
              { icon: CreditCard, text: 'Digitale Karte mit QR-Code' },
              { icon: Smartphone, text: 'Immer auf dem Handy dabei' },
              { icon: ArrowRight, text: 'Schneller Einlass' }
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                <benefit.icon className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-white/80 text-sm">{benefit.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Purchase Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-900 rounded-2xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Jetzt kaufen</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/60 text-sm mb-2">Vollständiger Name *</label>
                <input
                  type="text"
                  required
                  value={formData.holder_name}
                  onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={formData.holder_email}
                  onChange={(e) => setFormData({ ...formData, holder_email: e.target.value })}
                  className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="max@beispiel.ch"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Telefon (optional)</label>
                <input
                  type="tel"
                  value={formData.holder_phone}
                  onChange={(e) => setFormData({ ...formData, holder_phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="+41 79 123 45 67"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-3">Zahlungsmethode *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'twint', label: 'TWINT', icon: Smartphone },
                    { value: 'bank_transfer', label: 'Banküberweisung', icon: Banknote },
                    { value: 'sepa', label: 'SEPA', icon: ArrowRight },
                    { value: 'cash', label: 'Bar', icon: CreditCard }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: method.value })}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        formData.payment_method === method.value
                          ? 'border-red-500 bg-red-500/10 text-white'
                          : 'border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <method.icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bonuscard für CHF 100 kaufen
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
