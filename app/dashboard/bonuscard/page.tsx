'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, QrCode, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import Link from 'next/link'

interface BonusCard {
  id: string
  card_number: string
  holder_name: string
  payment_status: string
  status: string
  purchased_at: string
  paid_at: string | null
  qr_token: string
  scan_count: number
}

export default function DashboardBonusCardPage() {
  const [cards, setCards] = useState<BonusCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch('/api/bonuscard/user')
        const data = await response.json()
        if (data.cards) {
          setCards(data.cards)
        }
      } catch (err) {
        console.error('Failed to load bonus cards:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-white mb-8">Meine Bonuscards</h1>

          {cards.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-white/10">
              <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Du hast noch keine Bonuscard</p>
              <Link
                href="/bonuscard"
                className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors"
              >
                Bonuscard kaufen
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => {
                const isPaid = card.payment_status === 'paid'
                const isActive = card.status === 'active'
                const isValid = isPaid && isActive

                return (
                  <div
                    key={card.id}
                    className="bg-neutral-900 rounded-2xl p-6 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-white font-mono text-sm mb-1">{card.card_number}</p>
                        <p className="text-white/60 text-sm">{card.holder_name}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isValid 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {isValid ? (
                          <><Check className="w-3 h-3" /> Aktiv</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3" /> {isPaid ? 'Gesperrt' : 'Ausstehend'}</>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/40 mb-4">
                      <span>{card.scan_count} Scans</span>
                      <span>•</span>
                      <span>{new Date(card.purchased_at).toLocaleDateString('de-CH')}</span>
                    </div>

                    <Link
                      href={`/bonuscard/view/${card.qr_token}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      Karte anzeigen
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
