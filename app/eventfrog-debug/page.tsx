'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EventfrogDebugPage() {
  const [listData, setListData] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [loading, setLoading] = useState({ list: false, detail: false })
  const [eventId, setEventId] = useState('7440492341759100624')

  const testList = async () => {
    setLoading(prev => ({ ...prev, list: true }))
    try {
      const res = await fetch('/api/eventfrog/events')
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
    testList()
  }, [])

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Eventfrog API Debug</h1>
          <Link href="/events" className="text-red-500 hover:text-red-400">
            ← Zurück zu Events
          </Link>
        </div>

        {/* Test List Endpoint */}
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">/api/eventfrog/events</h2>
            <button
              onClick={testList}
              disabled={loading.list}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading.list ? 'Laden...' : 'Neu laden'}
            </button>
          </div>

          {listData && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="text-white/60">
                  Events gefunden: <strong className="text-white">{listData.count ?? '?'}</strong>
                </span>
                {listData.strategies && (
                  <span className="text-white/60">
                    Organizer IDs probiert: <strong className="text-white">{listData.strategies.organizerIdsTried}</strong>
                  </span>
                )}
              </div>

              {listData.events && listData.events.length > 0 ? (
                <div className="grid gap-3">
                  {listData.events.map((event: any) => (
                    <div key={event.id} className="bg-black/50 rounded-lg p-4 border border-white/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{event.title}</h3>
                          <p className="text-white/60 text-sm">{event.date} • {event.time}</p>
                          <p className="text-white/40 text-xs mt-1">ID: {event.id} | Organizer: {event.organizerName} ({event.organizerId})</p>
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
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
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
        </div>

        {/* Test Detail Endpoint */}
        <div className="bg-neutral-900 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">/api/eventfrog/event/[id]</h2>
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
            <p className="text-white/30 text-xs mt-1">
              Beispiel: 7440492341759100624 (aus dem Link https://eventfrog.ch/de/p/.../rvnz-project-kinker-...-7440492341759100624.html)
            </p>
          </div>

          {detailData && (
            <div className="space-y-4">
              {detailData.event ? (
                <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                  <h3 className="text-white font-semibold text-lg">{detailData.event.title}</h3>
                  <p className="text-white/60 text-sm">{detailData.event.date} • {detailData.event.time}</p>
                  <p className="text-white/40 text-sm mt-2">{detailData.event.location}</p>
                  <a
                    href={detailData.event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-red-500 text-sm hover:underline"
                  >
                    Ticketshop öffnen →
                  </a>
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
