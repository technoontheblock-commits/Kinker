'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EventfrogDebugPage() {
  const [listData, setListData] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [loading, setLoading] = useState({ list: false, detail: false })
  const [eventId, setEventId] = useState('7440492341759100624')

  const testList = async (debug = false) => {
    setLoading(prev => ({ ...prev, list: true }))
    try {
      const res = await fetch(`/api/eventfrog/events${debug ? '?debug=true' : ''}`)
      const data = await res.json()
      setListData(data)
    } catch (err: any) {
      setListData({ error: err.message })
    } finally {
      setLoading(prev => ({ ...prev, list: false }))
    }
  }

  const testDetail = async () => {
    setLoading(prev => ({ ...prev, detail: true }))
    try {
      const res = await fetch(`/api/eventfrog/event/${eventId}`)
      const data = await res.json()
      setDetailData(data)
    } catch (err: any) {
      setDetailData({ error: err.message })
    } finally {
      setLoading(prev => ({ ...prev, detail: false }))
    }
  }

  useEffect(() => {
    testList(true)
  }, [])

  const organizers = listData?.debug?.allOrganizersFound || []
  const hasKinkerEvents = listData?.events?.some((e: any) =>
    e.organizerName?.toLowerCase().includes('kinker')
  )

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Eventfrog API Debug</h1>
          <Link href="/events" className="text-red-500 hover:text-red-400">
            ← Zurück zu Events
          </Link>
        </div>

        {/* Organizer Discovery */}
        {organizers.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-3">🔍 Gefundene Organizers</h2>
            <p className="text-yellow-400/80 text-sm mb-4">
              Kopiere die richtige Organizer-ID und füge sie als <code className="bg-black/50 px-1 rounded">EVENTFROG_ORGANIZER_IDS</code> in Vercel ein.
            </p>
            <div className="space-y-2">
              {organizers.map((org: any) => (
                <div
                  key={org.id}
                  className={`flex items-center justify-between bg-black/50 rounded-lg px-4 py-3 border ${
                    org.name?.toLowerCase().includes('kinker')
                      ? 'border-green-500/50'
                      : 'border-white/5'
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">{org.name || 'Unbekannt'}</span>
                    <span className="text-white/40 text-sm ml-3 font-mono">ID: {org.id}</span>
                  </div>
                  {org.name?.toLowerCase().includes('kinker') && (
                    <span className="text-green-400 text-xs font-medium bg-green-500/10 px-2 py-1 rounded">
                      ✅ Wahrscheinlich Kinker
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Summary */}
        {listData && (
          <div className="bg-neutral-900 rounded-xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Gefilterte Events
                <span className="text-white/40 text-base font-normal ml-2">
                  ({listData.count || 0})
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => testList(false)}
                  disabled={loading.list}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Normal
                </button>
                <button
                  onClick={() => testList(true)}
                  disabled={loading.list}
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm disabled:opacity-50"
                >
                  {loading.list ? 'Laden...' : 'Debug'}
                </button>
              </div>
            </div>

            {!hasKinkerEvents && listData.events?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm">
                  ⚠️ Es werden Events angezeigt, aber <strong>keine von Kinker</strong>. Bitte setze die richtige Organizer-ID in den Env-Variablen.
                </p>
              </div>
            )}

            {listData.events && listData.events.length > 0 ? (
              <div className="grid gap-3">
                {listData.events.map((event: any) => (
                  <div key={event.id} className="bg-black/50 rounded-lg p-4 border border-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{event.title}</h3>
                        <p className="text-white/60 text-sm">{event.date} • {event.time}</p>
                        <p className="text-white/40 text-xs mt-1">
                          Organizer: {event.organizerName} ({event.organizerId})
                        </p>
                      </div>
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 text-sm hover:underline whitespace-nowrap ml-4"
                      >
                        Ticketshop →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">Keine Events gefunden.</p>
              </div>
            )}

            {listData.errors && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                <p className="text-yellow-400 text-sm font-medium mb-2">Fehler:</p>
                <ul className="space-y-1">
                  {listData.errors.map((err: string, i: number) => (
                    <li key={i} className="text-yellow-400/80 text-xs font-mono">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mt-4">
              <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60">Rohdaten (JSON)</summary>
              <pre className="mt-2 bg-black/50 rounded-lg p-4 text-xs text-green-400 overflow-auto max-h-96">
                {JSON.stringify(listData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Single Event Test */}
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Einzelnes Event testen</h2>
            <button
              onClick={testDetail}
              disabled={loading.detail}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading.detail ? 'Laden...' : 'Testen'}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-white/60 text-sm mb-2">Event ID</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
              placeholder="Eventfrog Event ID"
            />
          </div>

          {detailData && (
            <div className="space-y-4">
              {detailData.event ? (
                <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                  <h3 className="text-white font-semibold text-lg">{detailData.event.title}</h3>
                  <p className="text-white/60 text-sm">{detailData.event.date} • {detailData.event.time}</p>
                  <p className="text-white/40 text-sm mt-1">{detailData.event.location}</p>
                  <p className="text-white/40 text-xs mt-1">
                    Organizer: {detailData.event.organizerName} ({detailData.event.organizerId})
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{detailData.error || 'Event nicht gefunden'}</p>
                </div>
              )}

              <details>
                <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60">Rohdaten (JSON)</summary>
                <pre className="mt-2 bg-black/50 rounded-lg p-4 text-xs text-green-400 overflow-auto max-h-96">
                  {JSON.stringify(detailData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
