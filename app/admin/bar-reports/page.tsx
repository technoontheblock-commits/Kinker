'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  TrendingUp,
  Wallet,
  DollarSign,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  FileText,
  Power,
  Loader2,
  Search,
  Package,
  Check,
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

interface BarProductMinimal {
  id: string
  name: string
  category: string
  active: boolean
  sort_order: number
}

interface BarStockRecord {
  id: string
  event_id: string
  bar_id: string
  product_id: string
  initial_stock: number | null
  initial_submitted_at: string | null
  initial_submitted_by: string | null
  final_stock: number | null
  final_submitted_at: string | null
  final_submitted_by: string | null
}

interface StockModalState {
  open: boolean
  eventId: string | null
  barId: string | null
  barName: string
  type: 'initial' | 'final'
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
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [reports, setReports] = useState<Record<string, ReportData>>({})
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    location: '',
    status: 'upcoming' as BarEvent['status'],
  })
  const [creating, setCreating] = useState(false)

  const [stockModal, setStockModal] = useState<StockModalState>({
    open: false,
    eventId: null,
    barId: null,
    barName: '',
    type: 'initial',
  })
  const [stockProducts, setStockProducts] = useState<BarProductMinimal[]>([])
  const [stockRecords, setStockRecords] = useState<BarStockRecord[]>([])
  const [stockValues, setStockValues] = useState<Record<string, string>>({})
  const [stockSearch, setStockSearch] = useState('')
  const [stockLoading, setStockLoading] = useState(false)
  const [stockSaving, setStockSaving] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)
  const [eventStockRecords, setEventStockRecords] = useState<Record<string, BarStockRecord[]>>({})

  const stockModalSubmittedInfo = useMemo(() => {
    if (!stockModal.open || !stockModal.barId) {
      return { isSubmitted: false, submittedAt: null }
    }
    const record = stockRecords.find(
      r =>
        r.bar_id === stockModal.barId &&
        (stockModal.type === 'initial' ? r.initial_submitted_at != null : r.final_submitted_at != null)
    )
    const submittedAt =
      stockModal.type === 'initial' ? record?.initial_submitted_at ?? null : record?.final_submitted_at ?? null
    return {
      isSubmitted: submittedAt != null,
      submittedAt,
    }
  }, [stockModal, stockRecords])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bar-reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const fetchReport = useCallback(async (eventId: string) => {
    if (reports[eventId]) return

    setLoadingReports(prev => ({ ...prev, [eventId]: true }))
    setError(null)
    try {
      const res = await fetch(`/api/admin/bar-reports/${eventId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setReports(prev => ({ ...prev, [eventId]: data }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingReports(prev => ({ ...prev, [eventId]: false }))
    }
  }, [reports])

  const fetchEventStockRecords = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/bar-events/${eventId}/stock`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEventStockRecords(prev => ({ ...prev, [eventId]: data.stocks || [] }))
    } catch (err: any) {
      console.error('Fetch stock records error:', err)
    }
  }, [])

  const toggleExpand = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null)
      return
    }
    setExpandedEventId(eventId)
    fetchReport(eventId)
    fetchEventStockRecords(eventId)
  }

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
      setCreateModalOpen(false)
      await fetchEvents()
      if (data.event?.id) {
        setExpandedEventId(data.event.id)
        fetchReport(data.event.id)
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
      if (reports[eventId]) {
        setReports(prev => ({
          ...prev,
          [eventId]: { ...prev[eventId], event: { ...prev[eventId].event, ...data.event } },
        }))
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const closeEvent = async (eventId: string) => {
    if (!confirm('Event wirklich beenden? Danach kannst du die Bestellliste als PDF herunterladen.')) return
    await updateEvent(eventId, { status: 'closed' })
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Event wirklich löschen? Alle zugehörigen Bars werden ebenfalls gelöscht.')) return
    try {
      const res = await fetch(`/api/admin/bar-events/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Löschen')
      setEvents(prev => prev.filter(ev => ev.id !== id))
      if (expandedEventId === id) {
        setExpandedEventId(null)
      }
      setReports(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
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
      if (reports[eventId]) {
        setReports(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            event: {
              ...prev[eventId].event,
              event_bars: [...(prev[eventId].event.event_bars || []), data.bar],
            },
          },
        }))
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
      if (reports[eventId]) {
        setReports(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            event: {
              ...prev[eventId].event,
              event_bars: (prev[eventId].event.event_bars || []).filter(b => b.id !== barId),
            },
          },
        }))
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const downloadOrderList = async (eventId: string, eventName: string) => {
    try {
      const res = await fetch(`/api/admin/bar-reports/${eventId}/order-list`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Fehler beim Erstellen der Bestellliste')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bestellliste-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openStockModal = async (eventId: string, bar: EventBar, type: 'initial' | 'final') => {
    setStockModal({ open: true, eventId, barId: bar.id, barName: bar.name, type })
    setStockLoading(true)
    setStockError(null)
    setStockSearch('')
    setStockValues({})
    setStockProducts([])
    setStockRecords([])

    try {
      const res = await fetch(`/api/admin/bar-events/${eventId}/stock?barId=${bar.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')

      setStockProducts(data.products || [])
      setStockRecords(data.stocks || [])

      const values: Record<string, string> = {}
      for (const product of data.products || []) {
        const record = (data.stocks || []).find((s: BarStockRecord) => s.product_id === product.id)
        const value = type === 'initial' ? record?.initial_stock : record?.final_stock
        values[product.id] = value != null ? String(value) : '0'
      }
      setStockValues(values)
    } catch (err: any) {
      setStockError(err.message)
    } finally {
      setStockLoading(false)
    }
  }

  const closeStockModal = () => {
    setStockModal({ open: false, eventId: null, barId: null, barName: '', type: 'initial' })
    setStockProducts([])
    setStockRecords([])
    setStockValues({})
    setStockSearch('')
    setStockError(null)
  }

  const isStockSubmitted = (barId: string, type: 'initial' | 'final') => {
    return stockRecords.some(
      r =>
        r.bar_id === barId &&
        (type === 'initial' ? r.initial_submitted_at != null : r.final_submitted_at != null)
    )
  }

  const submitStock = async () => {
    if (!stockModal.eventId || !stockModal.barId) return

    setStockSaving(true)
    setStockError(null)

    try {
      const stocks: Record<string, number> = {}
      for (const product of stockProducts) {
        const raw = stockValues[product.id]
        const value = raw === '' ? 0 : parseInt(raw, 10)
        if (Number.isNaN(value) || value < 0) {
          throw new Error(`Ungültige Flaschenanzahl bei ${product.name}`)
        }
        stocks[product.id] = value
      }

      const res = await fetch(`/api/admin/bar-events/${stockModal.eventId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barId: stockModal.barId,
          type: stockModal.type,
          stocks,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      closeStockModal()
    } catch (err: any) {
      setStockError(err.message)
    } finally {
      setStockSaving(false)
    }
  }

  const filteredStockProducts = useMemo(() => {
    const term = stockSearch.toLowerCase()
    return stockProducts.filter(p => p.name.toLowerCase().includes(term))
  }, [stockProducts, stockSearch])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [events])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Bar Reports</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neues Event
        </button>
      </div>

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

      {loadingEvents ? (
        <p className="text-white/60">Lade Events...</p>
      ) : sortedEvents.length === 0 ? (
        <p className="text-white/60">Noch keine Events vorhanden.</p>
      ) : (
        <div className="space-y-4">
          {sortedEvents.map(event => {
            const isExpanded = expandedEventId === event.id
            const report = reports[event.id]
            const isLoading = loadingReports[event.id]
            const isClosed = event.status === 'closed'

            return (
              <div
                key={event.id}
                className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(event.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        event.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : event.status === 'closed'
                          ? 'bg-white/10 text-white/60'
                          : event.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {event.status}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{event.name}</h2>
                      <p className="text-white/60 text-sm flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('de-CH')}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isClosed && (
                      <span className="hidden sm:inline text-xs text-white/40 mr-2">
                        Bestellliste verfügbar
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/10 p-5 space-y-8">
                        {/* Event editor */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Event bearbeiten</h3>
                          <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <input
                              type="text"
                              value={event.name}
                              onChange={e => updateEvent(event.id, { name: e.target.value })}
                              className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                            />
                            <input
                              type="date"
                              value={event.date}
                              onChange={e => updateEvent(event.id, { date: e.target.value })}
                              className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={event.location || ''}
                              onChange={e => updateEvent(event.id, { location: e.target.value })}
                              placeholder="Location"
                              className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
                            />
                            <select
                              value={event.status}
                              onChange={e => updateEvent(event.id, { status: e.target.value as BarEvent['status'] })}
                              className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                            >
                              {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {event.status !== 'closed' && event.status !== 'cancelled' && (
                              <button
                                onClick={() => closeEvent(event.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                              >
                                <Power className="w-4 h-4" />
                                Event beenden
                              </button>
                            )}
                            {isClosed && (
                              <button
                                onClick={() => downloadOrderList(event.id, event.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                Bestellliste PDF
                              </button>
                            )}
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Event löschen
                            </button>
                          </div>
                        </div>

                        {/* Bars */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Bars</h3>
                          <div className="space-y-2 mb-4">
                            {(event.event_bars || []).length === 0 ? (
                              <p className="text-white/50 text-sm">Noch keine Bars zugeordnet.</p>
                            ) : (
                              (event.event_bars || []).map(bar => {
                                const eventStocks = eventStockRecords[event.id] || []
                                const initialDone = eventStocks.some(r => r.bar_id === bar.id && r.initial_submitted_at != null)
                                const finalDone = eventStocks.some(r => r.bar_id === bar.id && r.final_submitted_at != null)
                                return (
                                  <div
                                    key={bar.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/50 rounded-lg"
                                  >
                                    <span className="text-white font-medium">{bar.name}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openStockModal(event.id, bar, 'initial')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                          initialDone
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                      >
                                        {initialDone ? <Check className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                        Anfangsstock
                                      </button>
                                      <button
                                        onClick={() => openStockModal(event.id, bar, 'final')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                          finalDone
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                      >
                                        {finalDone ? <Check className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                        Endstock
                                      </button>
                                      <button
                                        onClick={() => deleteBar(event.id, bar.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                          <AddBarForm onAdd={name => addBar(event.id, name)} />
                        </div>

                        {/* Report */}
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-white/60">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Lade Report...
                          </div>
                        ) : report ? (
                          <div className="space-y-8">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-900 rounded-2xl p-6 md:p-8 w-full max-w-md border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">Neues Event</h2>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={createEvent} className="space-y-5">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Event-Name</label>
                  <input
                    type="text"
                    required
                    value={newEvent.name}
                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="z. B. Summer Festival"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Datum</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Location (optional)</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="z. B. Kinker"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Status</label>
                  <select
                    value={newEvent.status}
                    onChange={e => setNewEvent({ ...newEvent, status: e.target.value as BarEvent['status'] })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newEvent.name || !newEvent.date}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Erstellen
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Modal */}
      <AnimatePresence>
        {stockModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/10"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {stockModal.type === 'initial' ? 'Anfangsstock' : 'Endstock'}
                    </h2>
                    <p className="text-white/60 text-sm">{stockModal.barName}</p>
                  </div>
                  <button
                    onClick={closeStockModal}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  {stockError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                      {stockError}
                    </div>
                  )}

                  {stockModalSubmittedInfo.isSubmitted && stockModalSubmittedInfo.submittedAt && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Bereits erfasst am {new Date(stockModalSubmittedInfo.submittedAt).toLocaleString('de-CH')}. Eine Änderung ist nicht mehr möglich.
                    </div>
                  )}

                  {stockLoading ? (
                    <div className="flex items-center justify-center gap-2 text-white/60 py-12">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Lade Produkte...
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          placeholder="Getränk suchen..."
                          value={stockSearch}
                          onChange={e => setStockSearch(e.target.value)}
                          disabled={stockModalSubmittedInfo.isSubmitted}
                          className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                        />
                      </div>

                      {filteredStockProducts.length === 0 ? (
                        <p className="text-white/50 text-sm">Keine Produkte gefunden.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead className="bg-black/50 text-white/60 text-sm">
                            <tr>
                              <th className="px-4 py-3 font-medium">Produkt</th>
                              <th className="px-4 py-3 font-medium text-right w-32">Flaschen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredStockProducts.map(product => (
                              <tr key={product.id} className="hover:bg-white/5">
                                <td className="px-4 py-3 text-white">{product.name}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center bg-black border border-white/10 rounded-lg overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = parseInt(stockValues[product.id] || '0', 10)
                                        if (current > 0) {
                                          setStockValues(prev => ({ ...prev, [product.id]: String(current - 1) }))
                                        }
                                      }}
                                      disabled={stockModalSubmittedInfo.isSubmitted}
                                      className="px-2.5 py-2 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={stockValues[product.id] ?? '0'}
                                      onChange={e => {
                                        const val = e.target.value
                                        if (val === '' || /^\d*$/.test(val)) {
                                          setStockValues(prev => ({ ...prev, [product.id]: val }))
                                        }
                                      }}
                                      disabled={stockModalSubmittedInfo.isSubmitted}
                                      className="w-12 px-1 py-2 bg-transparent text-white text-center focus:outline-none disabled:opacity-50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = parseInt(stockValues[product.id] || '0', 10)
                                        setStockValues(prev => ({ ...prev, [product.id]: String(current + 1) }))
                                      }}
                                      disabled={stockModalSubmittedInfo.isSubmitted}
                                      className="px-2.5 py-2 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={closeStockModal}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    {stockModalSubmittedInfo.isSubmitted ? 'Schliessen' : 'Abbrechen'}
                  </button>
                  {!stockModalSubmittedInfo.isSubmitted && (
                    <button
                      type="button"
                      onClick={submitStock}
                      disabled={stockSaving || stockLoading}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      {stockSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Speichern
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
