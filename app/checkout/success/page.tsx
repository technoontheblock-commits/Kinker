'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [status, setStatus] = useState<'loading' | 'success'>('loading')

  useEffect(() => {
    // Simulate loading for now
    const timer = setTimeout(() => {
      setStatus('success')
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Bestellung wird verarbeitet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Bestellung erfolgreich!</h1>
        
        <p className="text-white/60 text-lg mb-2">
          Vielen Dank für deine Bestellung bei KINKER Basel.
        </p>
        
        {orderNumber && (
          <p className="text-white/40 mb-8">
            Bestellnummer: <span className="text-white font-mono">{orderNumber}</span>
          </p>
        )}

        <div className="space-y-4">
          <p className="text-white/60">
            Du erhältst eine Bestätigungs-E-Mail mit deinen Bestell Details.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="/dashboard/orders"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Meine Bestellungen
            </Link>
            <Link
              href="/events"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
            >
              Weitere Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Laden...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
