'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, Loader2, Smartphone, Banknote, ArrowRight, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BonusCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    holder_name: '',
    holder_email: '',
    holder_phone: '',
    payment_method: 'bank_transfer',
    referral_code: ''
  })
  const [referralValidation, setReferralValidation] = useState<{
    valid: boolean
    discount_percent?: number
    final_price?: number
    error?: string
  } | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        setIsLoggedIn(!!data.user)
      } catch {
        setIsLoggedIn(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        const price = referralValidation?.valid ? '90' : '100'
        router.push(`/membership/success?card=${data.card.card_number}&url=${encodeURIComponent(data.card.view_url)}&method=${formData.payment_method}&price=${price}`)
      } else {
        alert(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation(null)
      return
    }
    setValidatingCode(true)
    try {
      const response = await fetch(`/api/referral/validate?code=${encodeURIComponent(code.trim())}`)
      const data = await response.json()
      setReferralValidation(data)
    } catch {
      setReferralValidation({ valid: false, error: 'Validierung fehlgeschlagen' })
    } finally {
      setValidatingCode(false)
    }
  }

  useEffect(() => {
    const code = formData.referral_code
    if (code.trim().length >= 3) {
      const timeout = setTimeout(() => validateReferralCode(code), 500)
      return () => clearTimeout(timeout)
    } else {
      setReferralValidation(null)
    }
  }, [formData.referral_code])

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
              Kinker <span className="text-red-500">Membership</span>
            </h1>
            <p className="text-white/60 text-lg">
              Deine Membership für exklusive Preisermässigungen
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
                    <p className="text-white/40 text-xs">MEMBERSHIP</p>
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
                    <p className={`font-bold text-2xl ${referralValidation?.valid ? 'text-green-500' : 'text-red-500'}`}>
                      CHF {referralValidation?.valid ? '90' : '100'}
                    </p>
                    {referralValidation?.valid && (
                      <p className="text-green-400 text-xs">10% Rabatt</p>
                    )}
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

          {/* Purchase Form or Login CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-900 rounded-2xl p-8 border border-white/10"
          >
            {isCheckingAuth ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : isLoggedIn ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Jetzt bestellen</h2>
                
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
                    <label className="block text-white/60 text-sm mb-2">Referral-Code (optional)</label>
                    <input
                      type="text"
                      value={formData.referral_code}
                      onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors uppercase"
                      placeholder="z.B. LUCA-2026-A7B2"
                    />
                    {validatingCode && (
                      <p className="text-white/40 text-xs mt-1">Wird geprüft...</p>
                    )}
                    {referralValidation?.valid && (
                      <p className="text-green-400 text-xs mt-1">✓ Code gültig – 10% Rabatt</p>
                    )}
                    {referralValidation?.error && (
                      <p className="text-red-400 text-xs mt-1">✗ {referralValidation.error}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-3">Zahlungsmethode *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'bank_transfer', label: 'Banküberweisung', icon: Banknote },
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
                        Membership für CHF {referralValidation?.valid ? '90' : '100'} bestellen
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-white mb-4">Jetzt bestellen</h2>
                <p className="text-white/60 mb-8">
                  Melde dich an, um deine persönliche Membership zu bestellen.
                </p>
                <Link
                  href="/login?redirect=/membership"
                  className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  Einloggen um Membership zu bestellen
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
