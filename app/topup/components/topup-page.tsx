'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NfcScanner } from '@/components/bar/nfc-scanner'
import type { Bracelet } from '@/components/bar/types'
import { formatChf } from '@/lib/bar'
import type { BarEvent } from '@/lib/database.types'
import { Wallet, Banknote, CreditCard, RefreshCw, Check } from 'lucide-react'

type Step = 'scan' | 'topup' | 'success'

interface TopUpResult {
  transaction_id: string
  bracelet_id: string
  amount: number
  previous_balance: number
  new_balance: number
  reference: string
  payment_method: string
}

interface TopUpPageProps {
  staffName: string
  currentEvent: BarEvent | null
}

const PRESET_AMOUNTS = [10, 20, 50, 100]

export function TopUpPage({ staffName, currentEvent }: TopUpPageProps) {
  const [step, setStep] = useState<Step>('scan')
  const [bracelet, setBracelet] = useState<Bracelet | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'terminal'>('cash')
  const [reference, setReference] = useState<string>('')
  const [result, setResult] = useState<TopUpResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const resetFlow = useCallback(() => {
    setStep('scan')
    setBracelet(null)
    setAmount(0)
    setCustomAmount('')
    setPaymentMethod('cash')
    setReference('')
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  const handleScanSuccess = useCallback(async (nfcUid: string) => {
    setError(null)
    try {
      const response = await fetch('/api/topup/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfc_uid: nfcUid }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Scan fehlgeschlagen')
        return
      }
      setBracelet(data.bracelet)
      setStep('topup')
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Scannen')
    }
  }, [])

  const effectiveAmount = amount > 0 ? amount : parseFloat(customAmount.replace(',', '.')) || 0

  const handleTopUp = useCallback(async () => {
    if (!bracelet) return
    if (!currentEvent) {
      setError('Kein Event ausgewählt')
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
          nfcUid: bracelet.nfcUid,
          amount: effectiveAmount,
          paymentMethod,
          reference: reference.trim(),
          eventId: currentEvent.id,
          barId: null,
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
  }, [bracelet, currentEvent, effectiveAmount, paymentMethod, reference])

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-display font-bold text-lg tracking-tight">GUTHABEN AUFADEN</span>
          {currentEvent && (
            <span className="hidden sm:inline text-xs text-white/40">
              {currentEvent.name}
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

          {step === 'scan' && currentEvent && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <NfcScanner onScan={handleScanSuccess} />
            </motion.div>
          )}

          {step === 'topup' && bracelet && (
            <motion.div
              key="topup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto"
            >
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">
                <div className="w-full max-w-md space-y-6">
                  {/* Bracelet header */}
                  <div className="text-center">
                    <p className="text-white/50 text-sm mb-1">Armband</p>
                    <h2 className="text-3xl font-display font-bold font-mono">{bracelet.displayUid}</h2>
                    <p className="text-white/60 mt-1">Aktuelles Guthaben: <span className="text-white font-display font-bold">{formatChf(bracelet.balance)}</span></p>
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
                      <span className="text-xl font-display font-bold text-green-400">{formatChf(bracelet.balance + effectiveAmount)}</span>
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

      {/* Footer info */}
      <div className="absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] text-white/30 pointer-events-none">
        Kinker Abendkasse • Nicht zurück navigierbar
      </div>
    </div>
  )
}
