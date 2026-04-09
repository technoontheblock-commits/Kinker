'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Calendar,
  TrendingUp,
  Users,
  Ticket,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface EventfrogEvent {
  id: string
  title: string
  date: string
  time: string
  price: number
  soldOut: boolean
  url: string
}

interface SalesData {
  totalRevenue: number
  totalTickets: number
  totalOrders: number
  sales: any[]
}

export default function AdminEventfrogPage() {
  const [events, setEvents] = useState<EventfrogEvent[]>([])
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(false)
  const [error, setError] = useState('')
  const [salesError, setSalesError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    loadEvents()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user?.role !== 'admin') {
        window.location.href = '/'
        return
      }
      setUser(data.user)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/eventfrog/events')
      
      if (!res.ok) {
        throw new Error('Failed to load events')
      }
      
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSalesData = async () => {
    try {
      setSalesLoading(true)
      setSalesError('')
      const res = await fetch('/api/eventfrog/sales')
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load sales data')
      }
      
      const data = await res.json()
      setSalesData(data)
    } catch (err: any) {
      setSalesError(err.message)
    } finally {
      setSalesLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Eventfrog Integration</h1>
              <p className="text-white/50">Events und Verkaufsdaten</p>
            </div>
          </div>
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400">{error}</p>
              <p className="text-red-400/70 text-sm mt-1">
                Stelle sicher, dass EVENTFROG_API_KEY und EVENTFROG_ORGANIZER_ID in der .env.local konfiguriert sind.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-white">{events.length}</span>
            </div>
            <p className="text-white/60">Events auf Eventfrog</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <Ticket className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-white">
                {events.filter(e => e.soldOut).length}
              </span>
            </div>
            <p className="text-white/60">Ausverkaufte Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <button
                onClick={loadSalesData}
                disabled={salesLoading}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {salesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Laden'}
              </button>
            </div>
            <p className="text-white/60">Verkaufsdaten (Organizer API)</p>
          </motion.div>
        </div>

        {/* Sales Data Section */}
        {salesData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-zinc-900 rounded-xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-4">Verkaufsübersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">
                  CHF {salesData.totalRevenue?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-white/50">Gesamtumsatz</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">
                  {salesData.totalTickets?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-white/50">Verkaufte Tickets</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">
                  {salesData.totalOrders?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-white/50">Bestellungen</div>
              </div>
            </div>
          </motion.div>
        )}

        {salesError && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400">
              Organizer API nicht verfügbar: {salesError}
            </p>
            <p className="text-yellow-400/70 text-sm mt-1">
              Für Verkaufsdaten benötigst du die Organizer API Berechtigung.
            </p>
          </div>
        )}

        {/* Events List */}
        <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Events</h2>
            <a
              href="https://eventfrog.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Eventfrog öffnen
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="divide-y divide-white/10">
            {events.length === 0 ? (
              <div className="p-8 text-center text-white/60">
                Keine Events gefunden
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{event.title}</h3>
                    <p className="text-sm text-white/50">
                      {event.date} | {event.time} | 
                      {event.price ? ` CHF ${event.price}` : ' Preis auf Anfrage'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.soldOut && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded">
                        Ausverkauft
                      </span>
                    )}
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
