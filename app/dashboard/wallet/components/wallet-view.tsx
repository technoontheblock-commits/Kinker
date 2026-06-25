'use client'

import { useState, useCallback } from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight, Minus, CreditCard, Plus, Loader2, CheckCircle } from 'lucide-react'
import { formatChf } from '@/lib/bar'

interface WalletViewProps {
  wallet: {
    id: string
    balance: number
    currency: string
    qr_token: string
  } | null
  transactions: {
    id: string
    amount: number
    type: 'top_up' | 'payment' | 'tip' | 'refund' | 'cancel'
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    description: string | null
    reference: string | null
    created_at: string
    items: { name: string; quantity: number; total: number }[]
  }[]
}

const typeLabels: Record<string, string> = {
  top_up: 'Aufladung',
  payment: 'Bezahlung',
  tip: 'Trinkgeld',
  refund: 'Rückbuchung',
  cancel: 'Storno',
}

const PRESET_AMOUNTS = [10, 20, 50, 100]

export function WalletView({ wallet, transactions }: WalletViewProps) {
  const [amount, setAmount] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const effectiveAmount = amount > 0 ? amount : parseFloat(customAmount.replace(',', '.')) || 0

  const handleTopUp = useCallback(async () => {
    if (!wallet || effectiveAmount <= 0) {
      setError('Bitte einen gültigen Betrag eingeben')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/wallet/topup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Aufladen fehlgeschlagen')
        return
      }

      if (data.hosted_checkout_url) {
        window.location.href = data.hosted_checkout_url
      } else {
        setError('Checkout-URL nicht gefunden')
      }
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Aufladen')
    } finally {
      setLoading(false)
    }
  }, [wallet, effectiveAmount])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Wallet</h1>

      {!wallet ? (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-8 text-center">
          <Wallet className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Kein Wallet gefunden.</p>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <div className="bg-gradient-to-br from-red-500/20 to-neutral-900 border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-white/60 font-medium">Aktuelles Guthaben</span>
            </div>
            <p className="text-5xl md:text-6xl font-display font-bold">
              {formatChf(wallet.balance)}
            </p>
            <p className="text-white/40 text-sm mt-2">Währung: {wallet.currency}</p>
          </div>

          {/* Top-up card */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-red-500" />
              Guthaben aufladen
            </h2>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset)
                    setCustomAmount('')
                    setError(null)
                    setSuccess(null)
                  }}
                  className={`py-3 rounded-xl font-display font-bold transition-colors ${
                    amount === preset
                      ? 'bg-red-500 text-white'
                      : 'bg-black/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                min="0"
                step="0.05"
                placeholder="Eigener Betrag"
                value={customAmount}
                onChange={e => {
                  setCustomAmount(e.target.value)
                  setAmount(0)
                  setError(null)
                  setSuccess(null)
                }}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">CHF</span>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            {success && (
              <p className="text-green-400 text-sm mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            )}

            <button
              onClick={handleTopUp}
              disabled={loading || effectiveAmount <= 0}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird weitergeleitet...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {effectiveAmount > 0 ? formatChf(effectiveAmount) : 'Betrag'} mit Karte aufladen
                </>
              )}
            </button>
          </div>

          {/* Transactions */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                Letzte Transaktionen
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                Noch keine Transaktionen vorhanden.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {transactions.map(tx => {
                  const isNegative = tx.type === 'payment' || tx.type === 'tip'
                  const isPositive = tx.type === 'top_up' || tx.type === 'refund'
                  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus
                  const colorClass = isPositive
                    ? 'text-green-400'
                    : isNegative
                    ? 'text-red-400'
                    : 'text-white/60'

                  return (
                    <li key={tx.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                      <div className={`mt-1 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium truncate">{typeLabels[tx.type] || tx.type}</p>
                          <p className={`font-display font-bold whitespace-nowrap ${colorClass}`}>
                            {isPositive ? '+' : isNegative ? '-' : ''}
                            {formatChf(tx.amount)}
                          </p>
                        </div>
                        <p className="text-sm text-white/50 truncate">
                          {tx.description || tx.reference || '–'}
                        </p>
                        {tx.items && tx.items.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {tx.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs text-white/40 bg-black/20 rounded-lg px-3 py-2"
                              >
                                <span className="truncate">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="whitespace-nowrap ml-3">
                                  {formatChf(item.total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs text-white/30 mt-1">
                          {new Date(tx.created_at).toLocaleString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {tx.status !== 'completed' && (
                            <span className="ml-2 capitalize">({tx.status})</span>
                          )}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
