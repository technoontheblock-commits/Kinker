'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, QrCode, ExternalLink, AlertTriangle, Check, Gift, Copy } from 'lucide-react'
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

interface ReferralInfo {
  code: string
  total_points: number
}

export default function DashboardBonusCardPage() {
  const [cards, setCards] = useState<BonusCard[]>([])
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [cardsRes, referralRes] = await Promise.all([
          fetch('/api/membership/user'),
          fetch('/api/referral/my-code')
        ])
        const cardsData = await cardsRes.json()
        const referralData = await referralRes.json()

        if (cardsData.cards) {
          setCards(cardsData.cards)
        }
        if (referralData.code) {
          setReferralInfo(referralData)
        }
      } catch (err) {
        console.error('Failed to load bonus cards:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const copyCode = () => {
    if (referralInfo?.code) {
      navigator.clipboard.writeText(referralInfo.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
          <h1 className="text-3xl font-bold text-white mb-8">Meine Memberships</h1>

          {referralInfo && (
            <div className="bg-gradient-to-br from-neutral-900 to-black rounded-2xl p-6 border border-white/10 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-white">Dein Referral-Code</h2>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <code className="flex-1 bg-black rounded-xl px-4 py-3 text-white font-mono text-lg border border-white/10">
                  {referralInfo.code}
                </code>
                <button
                  onClick={copyCode}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  title="Code kopieren"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white/60" />}
                </button>
              </div>
              <p className="text-white/60 text-sm">
                Gib diesen Code an Freunde weiter. Sie erhalten 10% Rabatt auf ihre Membership und du erhältst 200 Punkte pro erfolgreicher Bestellung.
              </p>
              {referralInfo.total_points > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-sm">Gesammelte Punkte</p>
                  <p className="text-2xl font-bold text-white">{referralInfo.total_points}</p>
                </div>
              )}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-white/10">
              <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Du hast noch keine Membership</p>
              <Link
                href="/membership"
                className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors"
              >
                Membership kaufen
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
                      href={`/membership/view/${card.qr_token}`}
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
