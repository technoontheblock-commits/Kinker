'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrScanner } from '@/components/bar/qr-scanner'
import { CustomerSearch } from '@/components/bar/customer-search'
import type { Customer } from '@/components/bar/types'
import { formatChf, getFirstName } from '@/lib/bar'
import type { BarEvent, EventBar } from '@/lib/database.types'
import { Wallet, Banknote, CreditCard, RefreshCw, Check } from 'lucide-react'

type Step = 'scan' | 'topup' | 'success'

interface TopUpResult {
  transaction_id: string
  wallet_id: string
  amount: number
  previous_balance: number
  new_balance: number
  reference: string
  payment_method: string
}

interface TopUpPageProps {
  staffName: string
  currentEvent: BarEvent | null
  bars: EventBar[]
}

const PRESET_AMOUNTS = [10, 20, 50, 100]

export function TopUpPage({ staffName, currentEvent, bars }: TopUpPageProps) {
  const [step, setStep] = useState<Step>('scan')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'terminal'>('cash')
  const [reference, setReference] = useState<string>('')
  const [result, setResult] = useState<TopUpResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedBar, setSelectedBar] = useState<EventBar | null>(bars.length === 1 ? bars[0] : null)

  const resetFlow = useCallback(() => {
    setStep('scan')
    setCustomer(null)
    setAmount(0)
    setCustomAmount('')
    setPaymentMethod('cash')
    setReference('')
    setResult(null)
    setError(null)
    setLoading(false)
    setSearchOpen(false)
  }, [])

  const handleScanSuccess = useCallback(async (qrCode: string) => {
    setError(null)
    try {
      const response = await fetch('/api/topup/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Scan fehlgeschlagen')
        return
      }
      setCustomer(data.customer)
      setStep('topup')
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Scannen')
    }
  }, [])

  const selectCustomer = useCallback((selectedCustomer: Customer) => {
    setCustomer(selectedCustomer)
    setStep('topup')
  }, [])

  const effectiveAmount = amount > 0 ? amount : parseFloat(customAmount.replace(',', '.')) || 0

  const handleTopUp = useCallback(async () => {
    if (!customer) return
    if (!currentEvent || !selectedBar) {
      setError('Kein Event oder keine Bar ausgewählt')
      return
    }
    if (effectiveAmount <= 0) {
      setError('Bitte einen gültigen Betrag eingeben')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: effectiveAmount,
          paymentMethod,
          reference: reference.trim(),
          eventId: currentEvent.id,
          barId: selectedBar.id,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Aufladen fehlgeschlagen')
        return
      }
      setResult(data.result as TopUpResult)
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Aufladen')
    } finally {
      setLoading(false)
    }
  }, [customer, effectiveAmount, paymentMethod, reference])

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-display font-bold text-lg tracking-tight">GUTHABEN AUFADEN</span>
          {currentEvent && selectedBar && (
            <span className="hidden sm:inline text-xs text-white/40">
              {currentEvent.name} • {selectedBar.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>{staffName}</span>
          {step !== 'scan' && (
            <button
              onClick={resetFlow}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>

      {/* Error overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-30 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="absolute inset-0 pt-14">
        <AnimatePresence mode="wait">
          {step === 'scan' && !currentEvent && (
            <motion.div
              key="no-event"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center px-6"
            >
              <div className="max-w-md text-center">
                <p className="text-white/60 mb-2">Kein aktives Event gefunden.</p>
                <p className="text-white/40 text-sm">
                  Bitte legen Sie im Admin-Bereich ein Event mit Status «active» an.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'scan' && currentEvent && bars.length > 1 && !selectedBar && (
            <motion.div
              key="bar-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center px-6"
            >
              <div className="max-w-md w-full">
                <h2 className="text-2xl font-bold text-white text-center mb-2">Bar auswählen</h2>
                <p className="text-white/60 text-center mb-8">{currentEvent.name}</p>
                <div className="space-y-3">
                  {bars.map(bar => (
                    <button
                      key={bar.id}
                      onClick={() => setSelectedBar(bar)}
                      className="w-full py-5 px-6 bg-neutral-900 border border-white/10 rounded-xl text-left hover:border-red-500 transition-colors"
                    >
                      <span className="text-white font-semibold text-lg">{bar.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'scan' && currentEvent && (bars.length <= 1 || selectedBar) && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <QrScanner
                onScan={handleScanSuccess}
                onManualSearch={() => setSearchOpen(true)}
              />
            </motion.div>
          )}

          {step === 'topup' && customer && (
            <motion.div
              key="topup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto"
            >
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">
                <div className="w-full max-w-md space-y-6">
                  {/* Customer header */}
                  <div className="text-center">
                    <p className="text-white/50 text-sm mb-1">Gast</p>
                    <h2 className="text-3xl font-display font-bold">{getFirstName(customer.name)}</h2>
                    <p className="text-white/60 mt-1">Aktuelles Guthaben: <span className="text-white font-display font-bold">{formatChf(customer.balance)}</span></p>
                  </div>

                  {/* Amount presets */}
                  <div className="grid grid-cols-4 gap-3">
                    {PRESET_AMOUNTS.map(preset => (
                      <button
                        key={preset}
                        onClick={() => {
                          setAmount(preset)
                          setCustomAmount('')
                        }}
                        className={`py-4 rounded-xl font-display font-bold text-lg transition-colors ${
                          amount === preset
                            ? 'bg-red-500 text-white'
                            : 'bg-neutral-900 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
                      Eigener Betrag
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={e => {
                          setCustomAmount(e.target.value)
                          setAmount(0)
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-2xl font-display font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">CHF</span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <label className="block text-white/50 text-xs uppercase tracking-wider mb-3">
                      Zahlungsart
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                          paymentMethod === 'cash'
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Banknote className="w-5 h-5" />
                        Bargeld
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        Karte
                      </button>
                    </div>
                  </div>

                  {/* Optional reference */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                    <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
                      Referenz / Beleg (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Terminal-Beleg"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Aufladebetrag</span>
                      <span className="text-xl font-display font-bold">{formatChf(effectiveAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Neues Guthaben</span>
                      <span className="text-xl font-display font-bold text-green-400">{formatChf(customer.balance + effectiveAmount)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={handleTopUp}
                    disabled={loading || effectiveAmount <= 0}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                  >
                    {loading ? (
                      <span>Aufladen...</span>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        {formatChf(effectiveAmount)} aufladen
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
                >
                  <Check className="w-14 h-14 text-green-500" />
                </motion.div>

                <h2 className="text-4xl md:text-5xl font-display font-bold mb-2">Aufgeladen</h2>
                <p className="text-white/60 text-lg mb-8">{result.reference}</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Aufgeladen</p>
                    <p className="text-2xl font-display font-bold">{formatChf(result.amount)}</p>
                  </div>
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Neues Guthaben</p>
                    <p className="text-2xl font-display font-bold text-green-400">{formatChf(result.new_balance)}</p>
                  </div>
                </div>

                <button
                  onClick={resetFlow}
                  className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Nächster Kunde
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CustomerSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={selectCustomer}
        searchEndpoint="/api/topup/search"
      />

      {/* Footer info */}
      <div className="absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] text-white/30 pointer-events-none">
        Kinker Abendkasse • Nicht zurück navigierbar
      </div>
    </div>
  )
}
