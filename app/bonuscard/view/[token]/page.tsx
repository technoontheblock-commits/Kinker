'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, QrCode, AlertTriangle, Check } from 'lucide-react'
import { generateQRCodeDataUrl } from '@/lib/bonuscard'

interface BonusCardData {
  id: string
  card_number: string
  holder_name: string
  holder_email: string
  payment_status: string
  status: string
  purchased_at: string
  paid_at: string | null
  qr_token: string
  scan_count: number
}

export default function BonusCardViewPage({ params }: { params: { token: string } }) {
  const [card, setCard] = useState<BonusCardData | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCard() {
      try {
        const response = await fetch(`/api/bonuscard/view/${params.token}`)
        const data = await response.json()

        if (!response.ok || !data.card) {
          setError(data.error || 'Karte nicht gefunden')
          setLoading(false)
          return
        }

        setCard(data.card)

        // Generate QR code
        const qrDataUrl = await generateQRCodeDataUrl(data.card.qr_token)
        setQrCode(qrDataUrl)
      } catch (err) {
        setError('Ein Fehler ist aufgetreten')
      } finally {
        setLoading(false)
      }
    }

    loadCard()
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error || 'Karte nicht gefunden'}</p>
        </div>
      </div>
    )
  }

  const isPaid = card.payment_status === 'paid'
  const isActive = card.status === 'active'
  const isValid = isPaid && isActive

  return (
    <div className="min-h-screen bg-black pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Card - Landscape */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-6 border border-white/10 overflow-hidden mb-6 aspect-[1.586/1] max-w-2xl mx-auto">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
            
            <div className="relative h-full flex flex-col justify-between">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-500 font-bold text-sm tracking-wider">KINKER BASEL</p>
                  <p className="text-white/40 text-xs">STAMMGASTKARTE</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isValid 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isValid ? (
                      <><Check className="w-3 h-3" /> Aktiv</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3" /> {isPaid ? 'Gesperrt' : 'Zahlung ausstehend'}</>
                    )}
                  </div>
                  <CreditCard className="w-8 h-8 text-red-500/30" />
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-white/30 text-xs mb-1">KARTENINHABER</p>
                    <p className="text-white text-xl font-medium">{card.holder_name}</p>
                  </div>
                  <div className="flex items-end gap-6 md:gap-8">
                    <div>
                      <p className="text-white/30 text-xs mb-1">KARTENNUMMER</p>
                      <p className="text-white font-mono text-sm">{card.card_number}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-1">SCANS</p>
                      <p className="text-white font-mono text-sm">{card.scan_count}</p>
                    </div>
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="bg-white rounded-xl p-2 inline-block shrink-0">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" width="100" height="100" className="block" />
                  ) : (
                    <QrCode className="w-24 h-24 text-neutral-300" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/60 text-sm text-center mb-6">
            Zeige diesen QR-Code an der Abendkasse vor
          </p>

          {/* Wallet Buttons (prepared for Phase 2) */}
          <div className="space-y-3 mb-6">
            <button
              disabled
              className="w-full py-3 bg-white/5 text-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>🍎</span>
              Zu Apple Wallet hinzufügen
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded">Bald verfügbar</span>
            </button>
            <button
              disabled
              className="w-full py-3 bg-white/5 text-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>🤖</span>
              Zu Google Wallet hinzufügen
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded">Bald verfügbar</span>
            </button>
          </div>

          {/* Info */}
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
            <p className="text-white/40 text-xs text-center">
              Gekauft am {new Date(card.purchased_at).toLocaleDateString('de-CH')}
              {card.paid_at && ` • Bezahlt am ${new Date(card.paid_at).toLocaleDateString('de-CH')}`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
