'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface EventBar {
  id: string
  event_id: string
  name: string
  sort_order: number
  active: boolean
  created_at: string
}

interface BarEvent {
  id: string
  name: string
  date: string
  location: string | null
  status: 'upcoming' | 'active' | 'closed' | 'cancelled'
  created_at: string
  updated_at: string
  event_bars?: EventBar[]
}

export default function BarEventsAdminPage() {
  const [events, setEvents] = useState<BarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '', status: 'upcoming' as const })
  const [creating, setCreating] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bar-events')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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
      fetchEvents()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const updateEvent = async (event: BarEvent, updates: Partial<BarEvent>) => {
    try {
      const res = await fetch(`/api/admin/bar-events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')
      setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, ...data.event } : ev))
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
      setEvents(prev => prev.map(ev => {
        if (ev.id !== eventId) return ev
        return { ...ev, event_bars: [...(ev.event_bars || []), data.bar] }
      }))
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
      setEvents(prev => prev.map(ev => {
        if (ev.id !== eventId) return ev
        return { ...ev, event_bars: (ev.event_bars || []).filter(b => b.id !== barId) }
      }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Events & Bars</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Create event form */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-red-500" />
          Neues Event
        </h2>
        <form onSubmit={createEvent} className="grid md:grid-cols-4 gap-4">
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
          <button
            type="submit"
            disabled={creating || !newEvent.name || !newEvent.date}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white font-semibold transition-colors"
          >
            {creating ? 'Wird erstellt...' : 'Erstellen'}
          </button>
        </form>
      </div>

      {/* Events list */}
      {loading ? (
        <p className="text-white/60">Lade Events...</p>
      ) : events.length === 0 ? (
        <p className="text-white/60">Noch keine Events erstellt.</p>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{event.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'closed' ? 'bg-white/10 text-white/60' :
                      event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(event.id)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {expanded.has(event.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {expanded.has(event.id) && (
                <div className="border-t border-white/10 p-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <input
                      type="text"
                      value={event.name}
                      onChange={e => updateEvent(event, { name: e.target.value })}
                      className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={event.date}
                      onChange={e => updateEvent(event, { date: e.target.value })}
                      className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                    />
                    <select
                      value={event.status}
                      onChange={e => updateEvent(event, { status: e.target.value as BarEvent['status'] })}
                      className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="upcoming">upcoming</option>
                      <option value="active">active</option>
                      <option value="closed">closed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>

                  <h4 className="text-white font-semibold mb-3">Bars</h4>
                  <div className="space-y-2 mb-4">
                    {(event.event_bars || []).length === 0 ? (
                      <p className="text-white/50 text-sm">Noch keine Bars zugeordnet.</p>
                    ) : (
                      (event.event_bars || []).map(bar => (
                        <div key={bar.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                          <span className="text-white">{bar.name}</span>
                          <button
                            onClick={() => deleteBar(event.id, bar.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <AddBarForm onAdd={(name) => addBar(event.id, name)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
