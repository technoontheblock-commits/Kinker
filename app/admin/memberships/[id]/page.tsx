'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ArrowLeft, Check, X, AlertTriangle, Calendar, Scan } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'

interface BonusCard {
  id: string
  card_number: string
  holder_name: string
  holder_email: string
  payment_status: string
  status: string
  purchased_at: string
  paid_at: string | null
  scan_count: number
  last_scanned_at: string | null
  payment_method: string
  purchase_price: number
  referral_code: {
    code: string
    user_id: string
  } | null
}

interface ScanRecord {
  id: string
  scan_result: string
  scanner_name: string | null
  device_info: string | null
  created_at: string
}

export default function AdminBonusCardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [card, setCard] = useState<BonusCard | null>(null)
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadCard()
    loadScans()
  }, [params.id])

  async function loadCard() {
    try {
      const response = await fetch(`/api/membership/${params.id}`)
      const data = await response.json()
      if (data.card) {
        setCard(data.card)
      }
    } catch (err) {
      console.error('Failed to load card:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadScans() {
    try {
      const response = await fetch(`/api/membership/scan-history?card_id=${params.id}`)
      const data = await response.json()
      if (data.scans) {
        setScans(data.scans)
      }
    } catch (err) {
      console.error('Failed to load scans:', err)
    }
  }

  async function updateStatus(updates: { status?: string; payment_status?: string }) {
    setUpdating(true)
    try {
      const response = await fetch(`/api/membership/admin/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (response.ok && data.card) {
        setCard(data.card)
      } else {
        console.error('Failed to update status:', data.error)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">Karte nicht gefunden</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <Link
            href="/admin/memberships"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>

          <h1 className="text-3xl font-bold text-white mb-8">Membership-Details</h1>

          {/* Card Info */}
          <div className="bg-neutral-900 rounded-2xl p-8 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-white">{card.card_number}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-white/40 text-sm mb-1">Inhaber</p>
                <p className="text-white">{card.holder_name}</p>
                <p className="text-white/60 text-sm">{card.holder_email}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Gekauft am</p>
                <p className="text-white">{new Date(card.purchased_at).toLocaleDateString('de-CH')}</p>
                {card.paid_at && (
                  <p className="text-green-400 text-sm">Bezahlt am {new Date(card.paid_at).toLocaleDateString('de-CH')}</p>
                )}
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Zahlungsmethode</p>
                <p className="text-white capitalize">{card.payment_method}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Scans</p>
                <p className="text-white">{card.scan_count} {card.last_scanned_at && `(zuletzt ${new Date(card.last_scanned_at).toLocaleDateString('de-CH')})`}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Preis</p>
                <p className="text-white">CHF {(card.purchase_price / 100).toFixed(2)}</p>
              </div>
              {card.referral_code && (
                <div>
                  <p className="text-white/40 text-sm mb-1">Referral-Code</p>
                  <p className="text-white font-mono">{card.referral_code.code}</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                card.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : card.status === 'suspended'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-white/60'
              }`}>
                {card.status === 'active' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                Status: {card.status}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                card.payment_status === 'paid'
                  ? 'bg-green-500/20 text-green-400'
                  : card.payment_status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                Zahlung: {card.payment_status}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {card.payment_status === 'pending' && (
                <button
                  onClick={() => updateStatus({ payment_status: 'paid' })}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Als bezahlt markieren
                </button>
              )}
              {card.status === 'active' ? (
                <button
                  onClick={() => updateStatus({ status: 'suspended' })}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Sperren
                </button>
              ) : (
                <button
                  onClick={() => updateStatus({ status: 'active' })}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Aktivieren
                </button>
              )}
            </div>
          </div>

          {/* Scan History */}
          <div className="bg-neutral-900 rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Scan className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Scan-History</h2>
            </div>

            {scans.length === 0 ? (
              <p className="text-white/40 text-center py-8">Noch keine Scans</p>
            ) : (
              <div className="space-y-3">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-4 bg-black/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        scan.scan_result === 'valid' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-white text-sm capitalize">{scan.scan_result}</p>
                        {scan.scanner_name && (
                          <p className="text-white/40 text-xs">{scan.scanner_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-sm">
                        {new Date(scan.created_at).toLocaleDateString('de-CH')}
                      </p>
                      <p className="text-white/40 text-xs">
                        {new Date(scan.created_at).toLocaleTimeString('de-CH')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
