'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Gift,
  Calendar,
  CreditCard,
  Search,
  Briefcase,
  User,
  ArrowRight,
  Hash,
  Clock
} from 'lucide-react'

interface ReferralRedemption {
  id: string
  card_number: string
  holder_name: string
  holder_email: string
  purchase_price: number
  payment_status: string
  purchased_at: string
  referral_code: string
  referrer_id: string
  referrer_name: string
  referrer_email: string
  referrer_role: string
  referee_id: string | null
  referee_name: string
  referee_email: string
}

interface MonthGroup {
  month: string
  monthKey: string
  redemptions: ReferralRedemption[]
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('de-CH', { month: 'long', year: 'numeric' })
}

function formatMonthKey(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function AdminReferralsPage() {
  const [redemptions, setRedemptions] = useState<ReferralRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [coworkerOnly, setCoworkerOnly] = useState(false)

  useEffect(() => {
    loadReferrals()
  }, [])

  async function loadReferrals() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/referrals')
      const data = await response.json()
      if (data.redemptions) {
        setRedemptions(data.redemptions)
      }
    } catch (err) {
      console.error('Failed to load referrals:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredByCoworker = coworkerOnly
    ? redemptions.filter(r => r.referrer_role === 'coworker')
    : redemptions

  const monthGroups = filteredByCoworker.reduce<MonthGroup[]>((groups, redemption) => {
    const monthKey = formatMonthKey(redemption.purchased_at)
    const existingGroup = groups.find(g => g.monthKey === monthKey)
    if (existingGroup) {
      existingGroup.redemptions.push(redemption)
    } else {
      groups.push({
        month: formatMonth(redemption.purchased_at),
        monthKey,
        redemptions: [redemption]
      })
    }
    return groups
  }, [])

  const filteredGroups = monthGroups.map(group => ({
    ...group,
    redemptions: group.redemptions.filter(r =>
      r.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.card_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.redemptions.length > 0)

  const totalCount = filteredByCoworker.length
  const totalSaved = filteredByCoworker.reduce((sum, r) => sum + (10000 - r.purchase_price), 0)
  const coworkerCount = redemptions.filter(r => r.referrer_role === 'coworker').length

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Gift className="w-8 h-8 text-red-500" />
                Referrals
              </h1>
              <p className="text-white/60 mt-1">
                Übersicht aller eingelösten Referral-Codes
              </p>
            </div>
            <div className="flex items-center gap-6 bg-neutral-900/50 rounded-xl border border-white/10 px-5 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalCount}</p>
                <p className="text-white/40 text-xs">{coworkerOnly ? 'CoWorker' : 'Total'}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{formatPrice(totalSaved)}</p>
                <p className="text-white/40 text-xs">Erspart</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Suchen nach Name, E-Mail, Code oder Kartennummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-900 rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setCoworkerOnly(!coworkerOnly)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border transition-colors font-medium ${
                coworkerOnly
                  ? 'bg-green-500/20 border-green-500/50 text-green-500'
                  : 'bg-neutral-900 border-white/10 text-white/70 hover:text-white hover:border-white/20'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              CoWorker
              {coworkerCount > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  coworkerOnly ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white/50'
                }`}>
                  {coworkerCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">
                {coworkerOnly
                  ? 'Noch keine CoWorker-Referrals'
                  : searchQuery
                    ? 'Keine Treffer für deine Suche'
                    : 'Noch keine Referrals eingelöst'}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredGroups.map((group) => (
                <div key={group.monthKey}>
                  {/* Month Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold text-white">{group.month}</h2>
                    <span className="text-white/40 text-sm bg-white/5 px-3 py-1 rounded-full">
                      {group.redemptions.length} {group.redemptions.length === 1 ? 'Eintrag' : 'Einträge'}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Table Header (Desktop) */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-5 pb-2 text-white/40 text-sm font-medium">
                    <div className="col-span-3">Eingelöst von</div>
                    <div className="col-span-3">Code von</div>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-2">Karte & Datum</div>
                    <div className="col-span-2 text-right">Preis & Status</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2">
                    {group.redemptions.map((r) => (
                      <div
                        key={r.id}
                        className="bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/30 transition-colors overflow-hidden"
                      >
                        {/* Desktop Layout */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 items-center">
                          {/* Referee */}
                          <div className="col-span-3 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-red-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">{r.referee_name}</p>
                              <p className="text-white/40 text-xs truncate">{r.referee_email}</p>
                            </div>
                          </div>

                          {/* Referrer */}
                          <div className="col-span-3 flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              r.referrer_role === 'coworker' ? 'bg-green-500/15' : 'bg-green-500/15'
                            }`}>
                              <Gift className={`w-4 h-4 ${
                                r.referrer_role === 'coworker' ? 'text-green-500' : 'text-green-500'
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium text-sm truncate">{r.referrer_name}</p>
                                {r.referrer_role === 'coworker' && (
                                  <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide flex-shrink-0">
                                    CW
                                  </span>
                                )}
                              </div>
                              <p className="text-white/40 text-xs truncate">{r.referrer_email}</p>
                            </div>
                          </div>

                          {/* Code */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <Hash className="w-3.5 h-3.5 text-white/30" />
                              <span className="text-white font-mono text-sm">{r.referral_code}</span>
                            </div>
                          </div>

                          {/* Card & Date */}
                          <div className="col-span-2">
                            <p className="text-white font-mono text-sm">{r.card_number}</p>
                            <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatDateShort(r.purchased_at)} {formatTime(r.purchased_at)}</span>
                            </div>
                          </div>

                          {/* Price & Status */}
                          <div className="col-span-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <CreditCard className="w-3.5 h-3.5 text-white/40" />
                              <span className="text-white font-medium text-sm">{formatPrice(r.purchase_price)}</span>
                            </div>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              r.payment_status === 'paid'
                                ? 'bg-green-500/20 text-green-500'
                                : r.payment_status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {r.payment_status === 'paid' ? 'Bezahlt'
                                : r.payment_status === 'pending' ? 'Ausstehend'
                                : 'Storniert'}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="lg:hidden p-4">
                          {/* Top row: Referee → Referrer */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Eingelöst von</p>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-3.5 h-3.5 text-red-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-sm truncate">{r.referee_name}</p>
                                  <p className="text-white/40 text-xs truncate">{r.referee_email}</p>
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Code von</p>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Gift className="w-3.5 h-3.5 text-green-500" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-white font-medium text-sm truncate">{r.referrer_name}</p>
                                    {r.referrer_role === 'coworker' && (
                                      <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide flex-shrink-0">
                                        CW
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/40 text-xs truncate">{r.referrer_email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Code, Card, Price, Status */}
                          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg">
                              <Hash className="w-3 h-3 text-white/40" />
                              <span className="text-white font-mono text-xs">{r.referral_code}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/40 text-xs">Karte</span>
                              <span className="text-white font-mono text-xs">{r.card_number}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-auto">
                              <CreditCard className="w-3 h-3 text-white/40" />
                              <span className="text-white font-medium text-sm">{formatPrice(r.purchase_price)}</span>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              r.payment_status === 'paid'
                                ? 'bg-green-500/20 text-green-500'
                                : r.payment_status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {r.payment_status === 'paid' ? 'Bezahlt'
                                : r.payment_status === 'pending' ? 'Ausstehend'
                                : 'Storniert'}
                            </span>
                            <span className="text-white/30 text-xs">
                              {formatDateShort(r.purchased_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
