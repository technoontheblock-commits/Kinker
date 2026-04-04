'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [message, setMessage] = useState('Zahlung wird verarbeitet...')

  useEffect(() => {
    if (orderNumber) {
      checkPaymentStatus()
    }
  }, [orderNumber])

  const checkPaymentStatus = async () => {
    try {
      // Check order status from our database
      const res = await fetch(`/api/orders?orderNumber=${orderNumber}`)
      
      if (res.ok) {
        const order = await res.json()
        
        if (order.payment_status === 'paid') {
          setStatus('success')
          // Redirect to success page after a short delay
          setTimeout(() => {
            window.location.href = `/checkout/success?order=${orderNumber}`
          }, 2000)
        } else if (order.payment_status === 'failed') {
          setStatus('failed')
          setMessage('Zahlung fehlgeschlagen. Bitte versuche es erneut.')
        } else {
          // Still pending, check again in 3 seconds
          setTimeout(checkPaymentStatus, 3000)
        }
      } else {
        // If we can't check status, assume pending and retry
        setTimeout(checkPaymentStatus, 3000)
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
      setTimeout(checkPaymentStatus, 3000)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Zahlung erfolgreich!</h1>
          <p className="text-white/60">Du wirst weitergeleitet...</p>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Zahlung fehlgeschlagen</h1>
          <p className="text-white/60 mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/checkout"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Erneut versuchen
            </Link>
            <Link
              href="/dashboard/orders"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
            >
              Zu meinen Bestellungen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-white/60">{message}</p>
        <p className="text-white/40 text-sm mt-2">Bestellnummer: {orderNumber}</p>
      </div>
    </div>
  )
}
