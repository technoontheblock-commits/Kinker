'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Search, Filter, Check, X, Eye } from 'lucide-react'
import Link from 'next/link'
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
}

export default function AdminBonusCardsPage() {
  const [cards, setCards] = useState<BonusCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  useEffect(() => {
    loadCards()
  }, [paymentFilter])

  async function loadCards() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (paymentFilter) params.set('payment_status', paymentFilter)
      
      const response = await fetch(`/api/bonuscard/admin/list?${params}`)
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

  async function updateStatus(id: string, paymentStatus: string) {
    try {
      const response = await fetch(`/api/bonuscard/admin/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus })
      })

      if (response.ok) {
        loadCards()
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const filteredCards = cards.filter(card =>
    card.holder_name.toLowerCase().includes(filter.toLowerCase()) ||
    card.holder_email.toLowerCase().includes(filter.toLowerCase()) ||
    card.card_number.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black pt-20 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Memberships</h1>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <CreditCard className="w-4 h-4" />
              {cards.length} Karten
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Suchen..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/40" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-3 bg-neutral-900 rounded-xl border border-white/10 text-white focus:border-red-500 focus:outline-none"
              >
                <option value="">Alle Zahlungen</option>
                <option value="pending">Ausstehend</option>
                <option value="paid">Bezahlt</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>
          </div>

          {/* Cards Table */}
          <div className="bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="p-12 text-center text-white/40">
                Keine Karten gefunden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Karte</th>
                      <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Inhaber</th>
                      <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Status</th>
                      <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Zahlung</th>
                      <th className="text-left px-6 py-4 text-white/40 text-sm font-medium">Scans</th>
                      <th className="text-right px-6 py-4 text-white/40 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-mono text-sm">{card.card_number}</p>
                          <p className="text-white/40 text-xs">
                            {new Date(card.purchased_at).toLocaleDateString('de-CH')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white text-sm">{card.holder_name}</p>
                          <p className="text-white/40 text-xs">{card.holder_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            card.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : card.status === 'suspended'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {card.status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {card.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            card.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : card.payment_status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {card.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white text-sm">{card.scan_count}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {card.payment_status === 'pending' && (
                              <button
                                onClick={() => updateStatus(card.id, 'paid')}
                                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-medium transition-colors"
                              >
                                Bezahlt
                              </button>
                            )}
                            <Link
                              href={`/admin/bonuscards/${card.id}`}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-white/60" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
