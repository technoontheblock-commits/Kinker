'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Banknote, X, Delete, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatChf } from '@/lib/bar'
import type { Bracelet } from '@/components/bar/types'
import type { OrderItem } from './bar-page'

interface CustomerCheckoutProps {
  bracelet: Bracelet
  items: OrderItem[]
  subtotal: number
  onPay: (tip: number, receiptType: 'none' | 'app' | 'email', email?: string) => void
  onCancel: () => void
}

const TIP_PRESETS = [0, 1, 2, 3, 5]

export function CustomerCheckout({ bracelet, items, subtotal, onPay, onCancel }: CustomerCheckoutProps) {
  const [tip, setTip] = useState(0)
  const [customTipMode, setCustomTipMode] = useState(false)
  const [customTipInput, setCustomTipInput] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptType, setReceiptType] = useState<'none' | 'email'>('none')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const maxTip = useMemo(() => {
    return Math.max(0, bracelet.balance - subtotal)
  }, [bracelet.balance, subtotal])

  const effectiveTip = useMemo(() => {
    if (customTipMode) {
      const value = parseInt(customTipInput || '0', 10)
      return Math.min(Math.max(0, value), maxTip)
    }
    return Math.min(tip, maxTip)
  }, [customTipMode, customTipInput, tip, maxTip])

  const total = subtotal + effectiveTip
  const remaining = bracelet.balance - total

  // Auto-cap custom tip input whenever it would exceed the remaining balance
  useEffect(() => {
    if (customTipMode) {
      const value = parseInt(customTipInput || '0', 10)
      if (value > maxTip) {
        setCustomTipInput(Math.floor(maxTip).toString())
      }
    }
  }, [maxTip, customTipMode, customTipInput])

  const handleTipPreset = (amount: number) => {
    setCustomTipMode(false)
    setTip(Math.min(amount, maxTip))
  }

  const handleCustomDigit = (digit: string) => {
    setCustomTipMode(true)
    setTip(0)
    setCustomTipInput(prev => {
      const next = prev + digit
      const value = parseInt(next, 10)
      if (value > maxTip) return Math.floor(maxTip).toString()
      return next
    })
  }

  const handleCustomBackspace = () => {
    setCustomTipInput(prev => prev.slice(0, -1))
  }

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleReceiptConfirm = () => {
    if (receiptType === 'email') {
      const trimmed = email.trim()
      if (!trimmed || !isValidEmail(trimmed)) {
        setEmailError('Bitte eine gültige E-Mail-Adresse eingeben')
        return
      }
      setEmailError(null)
      onPay(effectiveTip, 'email', trimmed)
      return
    }
    onPay(effectiveTip, 'none')
  }

  if (showReceipt) {
    return (
      <div className="flex flex-col h-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-8">
          Beleg auswählen
        </h2>

        <div className="grid gap-4 mb-8">
          <button
            onClick={() => {
              setReceiptType('none')
              setEmailError(null)
            }}
            className={cn(
              'flex items-center gap-4 p-6 bg-neutral-900/60 border rounded-2xl transition-colors text-left',
              receiptType === 'none'
                ? 'border-red-500/50'
                : 'border-white/10 hover:border-white/30'
            )}
          >
            <div className="p-3 bg-white/10 rounded-xl">
              <X className="w-7 h-7 text-white/70" />
            </div>
            <div>
              <p className="text-lg font-semibold">Kein Beleg</p>
              <p className="text-white/50 text-sm">Kein digitaler Beleg wird erstellt</p>
            </div>
          </button>

          <button
            onClick={() => {
              setReceiptType('email')
            }}
            className={cn(
              'flex items-center gap-4 p-6 bg-neutral-900/60 border rounded-2xl transition-colors text-left',
              receiptType === 'email'
                ? 'border-red-500/50'
                : 'border-white/10 hover:border-white/30'
            )}
          >
            <div className="p-3 bg-white/10 rounded-xl">
              <Mail className="w-7 h-7 text-white/70" />
            </div>
            <div>
              <p className="text-lg font-semibold">Per E-Mail</p>
              <p className="text-white/50 text-sm">Beleg als PDF per E-Mail erhalten</p>
            </div>
          </button>

          {receiptType === 'email' && (
            <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 mt-2">
              <label htmlFor="receipt-email" className="block text-white/50 text-sm mb-2">
                E-Mail-Adresse
              </label>
              <input
                id="receipt-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
                placeholder="name@beispiel.ch"
                className={cn(
                  'w-full bg-neutral-900/60 border rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors',
                  emailError ? 'border-red-500' : 'border-white/10'
                )}
              />
              {emailError && (
                <p className="text-red-400 text-sm mt-2">{emailError}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto grid gap-4">
          <button
            onClick={handleReceiptConfirm}
            className="w-full py-5 bg-red-500 hover:bg-red-600 rounded-xl font-display font-bold text-xl transition-colors"
          >
            {receiptType === 'email' ? 'Beleg per E-Mail senden' : 'Ohne Beleg bezahlen'}
          </button>
          <button
            onClick={() => setShowReceipt(false)}
            className="text-white/50 hover:text-white text-sm"
          >
            Zurück zu Trinkgeld
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-6 pt-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Abbrechen
        </button>
        <p className="text-white/40 text-sm">Bitte Tablet zum Kunden drehen</p>
      </div>

      {/* Order summary */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-display font-bold mb-4">Armband {bracelet.displayUid}</h2>

        <div className="space-y-2 mb-4">
          {items.map(item => (
            <div key={item.productId} className="flex items-center justify-between text-white/80">
              <span>{item.quantity}x {item.name}</span>
              <span className="font-medium">{formatChf(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex items-center justify-between text-white/60">
            <span>Zwischensumme</span>
            <span>{formatChf(subtotal)}</span>
          </div>
          {effectiveTip > 0 && (
            <div className="flex items-center justify-between text-red-400">
              <span>Trinkgeld</span>
              <span>{formatChf(effectiveTip)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xl font-display font-bold pt-2">
            <span>Gesamt</span>
            <span>{formatChf(total)}</span>
          </div>
        </div>
      </div>

      {/* Balance info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Aktuelles Guthaben</p>
          <p className="text-xl font-display font-bold">{formatChf(bracelet.balance)}</p>
        </div>
        <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Restguthaben</p>
          <p className="text-xl font-display font-bold text-white">{formatChf(remaining)}</p>
        </div>
      </div>

      {/* Tip selection */}
      <div className="mb-4">
        <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Trinkgeld hinzufügen?</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {TIP_PRESETS.map(amount => (
            <button
              key={amount}
              onClick={() => handleTipPreset(amount)}
              className={cn(
                'py-4 rounded-xl font-semibold transition-colors border',
                !customTipMode && tip === amount
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-neutral-900/60 border-white/10 hover:border-white/30 text-white'
              )}
            >
              {amount === 0 ? 'Keines' : `${amount} CHF`}
            </button>
          ))}
          <button
            onClick={() => {
              setCustomTipMode(true)
              setTip(0)
              setCustomTipInput('')
            }}
            className={cn(
              'py-4 rounded-xl font-semibold transition-colors border',
              customTipMode
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-neutral-900/60 border-white/10 hover:border-white/30 text-white'
            )}
          >
            Eigener
          </button>
        </div>

        {customTipMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4"
          >
            <div className="text-center mb-4">
              <p className="text-white/50 text-sm">Eigener Betrag</p>
              <p className="text-4xl font-display font-bold mt-1">
                {formatChf(effectiveTip)}
              </p>
              <p className="text-white/40 text-xs mt-1">Max. {formatChf(maxTip)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  onClick={() => handleCustomDigit(digit)}
                  className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xl font-semibold transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleCustomDigit('0')}
                className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xl font-semibold transition-colors"
              >
                0
              </button>
              <button
                onClick={() => handleCustomDigit('00')}
                className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xl font-semibold transition-colors"
              >
                00
              </button>
              <button
                onClick={handleCustomBackspace}
                className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xl font-semibold transition-colors flex items-center justify-center"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 border-t border-white/10 px-6 py-4">
        <button
          onClick={() => setShowReceipt(true)}
          disabled={total > bracelet.balance}
          className={cn(
            'w-full max-w-3xl mx-auto flex items-center justify-center gap-3 py-5 rounded-xl font-display font-bold text-xl transition-colors',
            total > bracelet.balance
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
        >
          <Banknote className="w-6 h-6" />
          {formatChf(total)} bezahlen
        </button>
        {total > bracelet.balance && (
          <p className="text-center text-red-400 text-xs mt-2">Guthaben reicht nicht aus</p>
        )}
      </div>
    </div>
  )
}
