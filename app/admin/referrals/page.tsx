'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Gift, Calendar, CreditCard, Search, ArrowRightLeft, Briefcase } from 'lucide-react'

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

  // Apply coworker filter first
  const filteredByCoworker = coworkerOnly
    ? redemptions.filter(r => r.referrer_role === 'coworker')
    : redemptions

  // Group by month
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

  // Filter by search
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
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Gift className="w-8 h-8 text-red-500" />
                Referrals
              </h1>
              <p className="text-white/60 mt-1">
                Übersicht aller eingelösten Referral-Codes
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{totalCount}</p>
                <p className="text-white/40 text-sm">{coworkerOnly ? 'CoWorker' : 'Total'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-500">{formatPrice(totalSaved)}</p>
                <p className="text-white/40 text-sm">Erspart</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Suchen nach Code, Name, E-Mail oder Kartennummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-900 rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setCoworkerOnly(!coworkerOnly)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-colors font-medium ${
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
            <div className="space-y-8">
              {filteredGroups.map((group) => (
                <div key={group.monthKey}>
                  {/* Month Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold text-white">{group.month}</h2>
                    <span className="text-white/40 text-sm">
                      {group.redemptions.length} {group.redemptions.length === 1 ? 'Eintrag' : 'Einträge'}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {group.redemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        className="bg-neutral-900/50 rounded-xl border border-white/10 p-5 hover:border-red-500/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Referee (who redeemed) */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{redemption.referee_name}</p>
                              <p className="text-white/40 text-sm truncate">{redemption.referee_email}</p>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center gap-2 text-white/30 flex-shrink-0">
                            <ArrowRightLeft className="w-4 h-4" />
                            <span className="text-sm font-mono bg-white/5 px-2 py-1 rounded">
                              {redemption.referral_code}
                            </span>
                          </div>

                          {/* Referrer (who gave the code) */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Gift className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{redemption.referrer_name}</p>
                              <p className="text-white/40 text-sm truncate">{redemption.referrer_email}</p>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-4 flex-shrink-0 lg:text-right">
                            <div>
                              <p className="text-white font-mono text-sm">{redemption.card_number}</p>
                              <p className="text-white/40 text-xs">{formatDate(redemption.purchased_at)}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              redemption.payment_status === 'paid'
                                ? 'bg-green-500/20 text-green-500'
                                : redemption.payment_status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {redemption.payment_status === 'paid' ? 'Bezahlt'
                                : redemption.payment_status === 'pending' ? 'Ausstehend'
                                : 'Storniert'}
                            </div>
                            <div className="flex items-center gap-1 text-white/60">
                              <CreditCard className="w-4 h-4" />
                              <span className="text-sm font-medium">{formatPrice(redemption.purchase_price)}</span>
                            </div>
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
