'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  MapPin,
  TrendingUp,
  Wallet,
  DollarSign,
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

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
  status: 'upcoming' | 'active' | 'closed' | 'cancelled'
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

const STATUS_OPTIONS: BarEvent['status'][] = ['upcoming', 'active', 'closed', 'cancelled']

export default function BarReportsPage() {
  const [events, setEvents] = useState<BarEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [managementExpanded, setManagementExpanded] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    location: '',
    status: 'upcoming' as BarEvent['status'],
  })
  const [creating, setCreating] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bar-reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEvents(data.events || [])
      if (data.events?.[0] && !selectedEventId) {
        setSelectedEventId(data.events[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedEventId])

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

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.name || !newEvent.date) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/bar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen')
      setNewEvent({ name: '', date: '', location: '', status: 'upcoming' })
      await fetchEvents()
      if (data.event?.id) {
        setSelectedEventId(data.event.id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const updateEvent = async (eventId: string, updates: Partial<BarEvent>) => {
    try {
      const res = await fetch(`/api/admin/bar-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')
      setEvents(prev => prev.map(ev => (ev.id === eventId ? { ...ev, ...data.event } : ev)))
      if (report && report.event.id === eventId) {
        setReport({ ...report, event: { ...report.event, ...data.event } })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Event wirklich löschen? Alle zugehörigen Bars werden ebenfalls gelöscht.')) return
    try {
      const res = await fetch(`/api/admin/bar-events/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Löschen')
      setEvents(prev => prev.filter(ev => ev.id !== id))
      if (selectedEventId === id) {
        setSelectedEventId('')
        setReport(null)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addBar = async (eventId: string, name: string) => {
    if (!name.trim()) return
    try {
      const res = await fetch(`/api/admin/bar-events/${eventId}/bars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen')
      setEvents(prev =>
        prev.map(ev => {
          if (ev.id !== eventId) return ev
          return { ...ev, event_bars: [...(ev.event_bars || []), data.bar] }
        })
      )
      if (report && report.event.id === eventId) {
        setReport({
          ...report,
          event: {
            ...report.event,
            event_bars: [...(report.event.event_bars || []), data.bar],
          },
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteBar = async (eventId: string, barId: string) => {
    if (!confirm('Bar wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/bar-events/${eventId}/bars/${barId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Löschen')
      setEvents(prev =>
        prev.map(ev => {
          if (ev.id !== eventId) return ev
          return { ...ev, event_bars: (ev.event_bars || []).filter(b => b.id !== barId) }
        })
      )
      if (report && report.event.id === eventId) {
        setReport({
          ...report,
          event: {
            ...report.event,
            event_bars: (report.event.event_bars || []).filter(b => b.id !== barId),
          },
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectedEvent = events.find(ev => ev.id === selectedEventId)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Bar Reports</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 shrink-0" />
        <p className="text-sm">
          Events hier gelten ausschliesslich für das Bar- und Topup-System. Sie werden in der
          Tabelle <code className="bg-blue-500/20 px-1 rounded">bar_events</code> gespeichert.
          Für die öffentliche Website werden Events weiterhin im Admin-Tab «Events» erstellt.
        </p>
      </div>

      {/* Event management panel */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <button
          onClick={() => setManagementExpanded(prev => !prev)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <h2 className="text-xl font-bold text-white">Events & Bars verwalten</h2>
            <p className="text-white/60 text-sm mt-1">
              Events für /topup und /bar erstellen, bearbeiten und Bars zuweisen.
            </p>
          </div>
          {managementExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </button>

        {managementExpanded && (
          <div className="border-t border-white/10 p-6 space-y-8">
            {/* Create event form */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                Neues Event
              </h3>
              <form onSubmit={createEvent} className="grid md:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Event-Name"
                  value={newEvent.name}
                  onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="px-4 py-3 bg-black border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="px-4 py-3 bg-black border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
                />
                <select
                  value={newEvent.status}
                  onChange={e => setNewEvent({ ...newEvent, status: e.target.value as BarEvent['status'] })}
                  className="px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creating || !newEvent.name || !newEvent.date}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white font-semibold transition-colors"
                >
                  {creating ? 'Wird erstellt...' : 'Erstellen'}
                </button>
              </form>
            </div>

            {/* Selected event editor */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Event auswählen & bearbeiten</h3>

              {loading ? (
                <p className="text-white/60">Lade Events...</p>
              ) : events.length === 0 ? (
                <p className="text-white/60">Noch keine Events vorhanden.</p>
              ) : (
                <div className="space-y-4">
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="w-full md:w-96 px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">-- Event wählen --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} — {new Date(event.date).toLocaleDateString('de-CH')}
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="bg-black/50 border border-white/10 rounded-xl p-5 space-y-5">
                      <div className="grid md:grid-cols-4 gap-4">
                        <input
                          type="text"
                          value={selectedEvent.name}
                          onChange={e => updateEvent(selectedEvent.id, { name: e.target.value })}
                          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        />
                        <input
                          type="date"
                          value={selectedEvent.date}
                          onChange={e => updateEvent(selectedEvent.id, { date: e.target.value })}
                          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={selectedEvent.location || ''}
                          onChange={e => updateEvent(selectedEvent.id, { location: e.target.value })}
                          placeholder="Location"
                          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
                        />
                        <select
                          value={selectedEvent.status}
                          onChange={e => updateEvent(selectedEvent.id, { status: e.target.value as BarEvent['status'] })}
                          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3">Bars</h4>
                        <div className="space-y-2 mb-4">
                          {(selectedEvent.event_bars || []).length === 0 ? (
                            <p className="text-white/50 text-sm">Noch keine Bars zugeordnet.</p>
                          ) : (
                            (selectedEvent.event_bars || []).map(bar => (
                              <div
                                key={bar.id}
                                className="flex items-center justify-between p-3 bg-black/50 rounded-lg"
                              >
                                <span className="text-white">{bar.name}</span>
                                <button
                                  onClick={() => deleteBar(selectedEvent.id, bar.id)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <AddBarForm onAdd={name => addBar(selectedEvent.id, name)} />
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-end">
                        <button
                          onClick={() => deleteEvent(selectedEvent.id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Event löschen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report section */}
      {loading ? (
        <p className="text-white/60">Lade Events...</p>
      ) : events.length === 0 ? (
        <p className="text-white/60">Noch keine Events vorhanden.</p>
      ) : (
        <>
          {reportLoading ? (
            <p className="text-white/60">Lade Report...</p>
          ) : report ? (
            <div className="space-y-8">
              {/* Event header */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
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
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      report.event.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : report.event.status === 'closed'
                        ? 'bg-white/10 text-white/60'
                        : report.event.status === 'cancelled'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {report.event.status}
                  </span>
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

function AddBarForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(name)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Neue Bar hinzufügen"
        value={name}
        onChange={e => setName(e.target.value)}
        className="flex-1 px-4 py-2 bg-black border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </form>
  )
}
