'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const checkoutId = searchParams.get('checkout_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [order, setOrder] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (orderNumber) {
      verifyAndUpdateOrder()
    }
  }, [orderNumber])

  const verifyAndUpdateOrder = async () => {
    try {
      // Verify payment with SumUp
      const updateRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, checkoutId })
      })

      if (updateRes.ok) {
        const data = await updateRes.json()
        if (data.verified) {
          setOrder(data.order)
          setStatus('success')
        } else {
          setErrorMsg('Zahlung konnte nicht verifiziert werden.')
          setStatus('error')
        }
      } else {
        const errorData = await updateRes.json()
        // If verification fails, show error (don't assume success)
        setErrorMsg(errorData.error || 'Zahlung konnte nicht verifiziert werden.')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg('Fehler bei der Verifizierung. Bitte prüfe deine Bestellungen.')
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Zahlung wird verarbeitet...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Zahlung fehlgeschlagen</h1>
          <p className="text-white/60 mb-2">{errorMsg || 'Bei der Verarbeitung ist ein Fehler aufgetreten.'}</p>
          <p className="text-white/40 text-sm mb-6">
            Falls Geld abgebucht wurde, wird es innerhalb weniger Tage zurückerstattet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout" className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
              Erneut versuchen
            </Link>
            <Link href="/dashboard/orders" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors">
              Zu meinen Bestellungen
            </Link>
          </div>
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
        
        <h1 className="text-4xl font-bold text-white mb-4">Zahlung erfolgreich!</h1>
        
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
            Du erhältst eine Bestätigungs-E-Mail mit deinen Tickets / Bestell Details.
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
