'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

interface SumUpCardWidget {
  mount: (config: {
    id: string
    checkoutId: string
    onResponse: (type: string, body: Record<string, unknown>) => void
  }) => void
}

declare global {
  interface Window {
    SumUpCard?: SumUpCardWidget
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get('id')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!checkoutId) {
      setStatus('error')
      setErrorMsg('Keine Checkout-ID vorhanden. Bitte starte den Checkout erneut.')
      return
    }

    const interval = setInterval(() => {
      if (mountedRef.current) return
      if (window.SumUpCard) {
        mountedRef.current = true
        clearInterval(interval)
        try {
          window.SumUpCard.mount({
            id: 'sumup-card',
            checkoutId,
            onResponse: (type: string, body: Record<string, unknown>) => {
              console.log('[SumUp]', type, body)
              if (type === 'success' || body.status === 'PAID') {
                window.location.href = '/checkout/success?id=' + checkoutId
              } else if (type === 'error' || body.status === 'FAILED') {
                setStatus('error')
                setErrorMsg(
                  typeof body.message === 'string'
                    ? body.message
                    : 'Zahlung fehlgeschlagen. Bitte versuche es erneut.'
                )
              }
            },
          })
          setStatus('ready')
        } catch (err: unknown) {
          setStatus('error')
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Widget konnte nicht initialisiert werden.'
          )
        }
      }
    }, 100)

    const timeout = setTimeout(() => {
      if (!mountedRef.current) {
        clearInterval(interval)
        setStatus('error')
        setErrorMsg('SumUp Widget konnte nicht geladen werden. Bitte prüfe deine Internetverbindung.')
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [checkoutId])

  return (
    <>
      <Script
        src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="mb-6">
            <Link
              href="/merch"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zum Shop
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-6">Zahlung abschliessen</h1>

          {status === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <span className="ml-3 text-white/60">Zahlungswidget wird geladen...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-medium mb-1">Fehler</p>
                  <p className="text-white/70 text-sm">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          <div
            id="sumup-card"
            className={status === 'ready' ? 'block' : 'hidden'}
          />
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
