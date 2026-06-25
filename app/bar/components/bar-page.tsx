'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BarProduct, BarEvent, EventBar } from '@/lib/database.types'
import { QrScanner } from '@/components/bar/qr-scanner'
import { CustomerSearch } from '@/components/bar/customer-search'
import type { Customer } from '@/components/bar/types'
import { OrderMenu } from './order-menu'
import { CustomerCheckout } from './customer-checkout'
import { SuccessView } from './success-view'

type Step = 'scan' | 'order' | 'checkout' | 'success'

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
  currentEvent: BarEvent | null
  bars: EventBar[]
}

export function BarPage({ staffName, initialProducts, currentEvent, bars }: BarPageProps) {
  const [step, setStep] = useState<Step>('scan')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [payResult, setPayResult] = useState<PayResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedBar, setSelectedBar] = useState<EventBar | null>(bars.length === 1 ? bars[0] : null)

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
    setSearchOpen(false)
    setStep('scan')
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
      if (!currentEvent || !selectedBar) {
        setError('Kein Event oder keine Bar ausgewählt')
        return
      }
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
            eventId: currentEvent.id,
            barId: selectedBar.id,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Bezahlung fehlgeschlagen')
          return
        }

        setPayResult(data.result as PayResult)
        setStep('success')
      } catch (err: any) {
        setError(err.message || 'Netzwerkfehler bei der Bezahlung')
      }
    },
    [customer, items]
  )

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const selectCustomer = useCallback((selectedCustomer: Customer) => {
    setCustomer(selectedCustomer)
    setItems([])
    setStep('order')
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-display font-bold text-lg tracking-tight">BAR KASSE</span>
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

      <CustomerSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={selectCustomer}
        searchEndpoint="/api/bar/search"
      />

      {/* Footer info */}
      <div className="absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] text-white/30 pointer-events-none">
        Kinker Bar-Modus • Nicht zurück navigierbar
      </div>
    </div>
  )
}
