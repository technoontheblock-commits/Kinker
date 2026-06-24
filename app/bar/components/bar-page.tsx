'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BarProduct } from '@/lib/database.types'
import { formatChf } from '@/lib/bar'
import { QrScanner } from './qr-scanner'
import { OrderMenu } from './order-menu'
import { CustomerCheckout } from './customer-checkout'
import { SuccessView } from './success-view'

type Step = 'scan' | 'order' | 'checkout' | 'success'

export interface Customer {
  id: string
  name: string
  firstName: string
  email: string | null
  balance: number
  currency: string
  walletToken: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface PayResult {
  order_id: string
  order_number: string
  subtotal: number
  tip: number
  total: number
  remaining_balance: number
}

interface BarPageProps {
  staffName: string
  initialProducts: BarProduct[]
}

export function BarPage({ staffName, initialProducts }: BarPageProps) {
  const [step, setStep] = useState<Step>('scan')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [payResult, setPayResult] = useState<PayResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Keep the page "stuck": prevent back navigation and accidental reload
  useEffect(() => {
    history.pushState(null, '', location.href)

    const handlePopState = () => {
      history.pushState(null, '', location.href)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Keep the session alive and request wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch {
        // Wake lock may fail (e.g. not supported or tab not active)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    keepAliveRef.current = setInterval(async () => {
      try {
        await fetch('/api/bar/keep-alive', { method: 'POST' })
      } catch (err) {
        console.error('Keep-alive failed:', err)
      }
    }, 60000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (keepAliveRef.current) clearInterval(keepAliveRef.current)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  const resetFlow = useCallback(() => {
    setCustomer(null)
    setItems([])
    setPayResult(null)
    setError(null)
    setStep('scan')
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }, [])

  const handleScanSuccess = useCallback(async (qrCode: string) => {
    setError(null)
    try {
      const response = await fetch('/api/bar/scan', {
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
      setItems([])
      setStep('order')
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Scannen')
    }
  }, [])

  const handleConfirmOrder = useCallback((orderItems: OrderItem[]) => {
    setItems(orderItems)
    setStep('checkout')
  }, [])

  const handlePay = useCallback(
    async (tip: number, receiptType: 'none' | 'app' | 'email') => {
      if (!customer) return
      setError(null)

      try {
        const response = await fetch('/api/bar/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            items,
            tip,
            receiptType,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Bezahlung fehlgeschlagen')
          return
        }

        setPayResult(data.result as PayResult)
        setStep('success')

        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(() => {
          resetFlow()
        }, 6000)
      } catch (err: any) {
        setError(err.message || 'Netzwerkfehler bei der Bezahlung')
      }
    },
    [customer, items, resetFlow]
  )

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-display font-bold text-lg tracking-tight">BAR KASSE</span>
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
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <QrScanner onScan={handleScanSuccess} />
            </motion.div>
          )}

          {step === 'order' && customer && (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full"
            >
              <OrderMenu
                customer={customer}
                products={initialProducts}
                onConfirm={handleConfirmOrder}
                onCancel={resetFlow}
              />
            </motion.div>
          )}

          {step === 'checkout' && customer && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full"
            >
              <CustomerCheckout
                customer={customer}
                items={items}
                subtotal={subtotal}
                onPay={handlePay}
                onCancel={resetFlow}
              />
            </motion.div>
          )}

          {step === 'success' && payResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <SuccessView
                payResult={payResult}
                onDone={resetFlow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] text-white/30 pointer-events-none">
        Kinker Bar-Modus • Nicht zurück navigierbar
      </div>
    </div>
  )
}
