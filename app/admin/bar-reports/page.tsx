'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, MapPin, TrendingUp, Wallet, DollarSign, ShoppingCart } from 'lucide-react'

interface EventBar {
  id: string
  event_id: string
  name: string
  sort_order: number
  active: boolean
}

interface BarEvent {
  id: string
  name: string
  date: string
  location: string | null
  status: string
  event_bars?: EventBar[]
}

interface BarStat {
  bar_id: string
  bar_name: string
  order_count: number
  sales_total: number
  tip_total: number
}

interface ProductStat {
  name: string
  quantity: number
  total: number
}

interface ReportData {
  event: BarEvent
  barStats: BarStat[]
  topUpsByMethod: Record<string, number>
  totalTopUps: number
  totalPayments: number
  totalTips: number
  productStats: ProductStat[]
}

function formatChf(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount)
}

export default function BarReportsPage() {
  const [events, setEvents] = useState<BarEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bar-reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEvents(data.events || [])
      if (data.events?.[0]) {
        setSelectedEventId(data.events[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!selectedEventId) return

    async function fetchReport() {
      setReportLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/bar-reports/${selectedEventId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
        setReport(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setReportLoading(false)
      }
    }

    fetchReport()
  }, [selectedEventId])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Bar Reports</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/60">Lade Events...</p>
      ) : events.length === 0 ? (
        <p className="text-white/60">Noch keine Events vorhanden.</p>
      ) : (
        <>
          <div className="mb-8">
            <label className="block text-white/60 text-sm mb-2">Event auswählen</label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full md:w-96 px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} — {new Date(event.date).toLocaleDateString('de-CH')}
                </option>
              ))}
            </select>
          </div>

          {reportLoading ? (
            <p className="text-white/60">Lade Report...</p>
          ) : report ? (
            <div className="space-y-8">
              {/* Event header */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{report.event.name}</h2>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.event.date).toLocaleDateString('de-CH')}
                  </span>
                  {report.event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {report.event.location}
                    </span>
                  )}
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={<TrendingUp className="w-6 h-6 text-red-500" />}
                  label="Verbrauchtes Guthaben"
                  value={formatChf(report.totalPayments)}
                />
                <KpiCard
                  icon={<Wallet className="w-6 h-6 text-green-500" />}
                  label="Aufladungen gesamt"
                  value={formatChf(report.totalTopUps)}
                />
                <KpiCard
                  icon={<DollarSign className="w-6 h-6 text-yellow-500" />}
                  label="Trinkgeld gesamt"
                  value={formatChf(report.totalTips)}
                />
                <KpiCard
                  icon={<ShoppingCart className="w-6 h-6 text-blue-500" />}
                  label="Bestellungen"
                  value={report.barStats.reduce((sum, b) => sum + Number(b.order_count), 0).toString()}
                />
              </div>

              {/* Top-ups by method */}
              {Object.keys(report.topUpsByMethod).length > 0 && (
                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Aufladungen nach Zahlungsart</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(report.topUpsByMethod).map(([method, amount]) => (
                      <div key={method} className="bg-black/50 rounded-xl p-4">
                        <p className="text-white/60 text-sm capitalize mb-1">{method}</p>
                        <p className="text-xl font-bold text-white">{formatChf(amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bar stats */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Umsatz pro Bar</h3>
                </div>
                {report.barStats.length === 0 ? (
                  <div className="p-6 text-white/60">Keine Bar-Daten vorhanden.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-black/50 text-white/60 text-sm">
                      <tr>
                        <th className="px-6 py-3 font-medium">Bar</th>
                        <th className="px-6 py-3 font-medium text-right">Bestellungen</th>
                        <th className="px-6 py-3 font-medium text-right">Umsatz</th>
                        <th className="px-6 py-3 font-medium text-right">Trinkgeld</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.barStats.map(bar => (
                        <tr key={bar.bar_id} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-white font-medium">{bar.bar_name}</td>
                          <td className="px-6 py-4 text-white text-right">{bar.order_count}</td>
                          <td className="px-6 py-4 text-white text-right">{formatChf(bar.sales_total)}</td>
                          <td className="px-6 py-4 text-yellow-400 text-right">{formatChf(bar.tip_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Product stats */}
              {report.productStats.length > 0 && (
                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Top Produkte</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-black/50 text-white/60 text-sm">
                      <tr>
                        <th className="px-6 py-3 font-medium">Produkt</th>
                        <th className="px-6 py-3 font-medium text-right">Menge</th>
                        <th className="px-6 py-3 font-medium text-right">Umsatz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.productStats.map((product, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-white">{product.name}</td>
                          <td className="px-6 py-4 text-white text-right">{product.quantity}</td>
                          <td className="px-6 py-4 text-white text-right">{formatChf(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
