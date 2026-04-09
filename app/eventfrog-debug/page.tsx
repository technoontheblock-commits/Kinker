'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function EventfrogDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    runTest()
  }, [])

  const runTest = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/eventfrog/test')
      const data = await res.json()
      setResult({ status: res.status, data })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  const testResults = result?.data?.results?.tests || []
  const organizerId = result?.data?.organizerId
  const sampleEvents = result?.data?.results?.test1Data || []
  const allOrganizers = result?.data?.results?.allOrganizers || []

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Eventfrog API Debug</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Zusammenfassung</h2>
          <p className="text-white/70">Organizer ID: <span className="text-white font-mono">{organizerId || 'Nicht gesetzt'}</span></p>
          <p className="text-white/70 mt-2">API Status: {result?.data?.success ? <span className="text-green-400">OK</span> : <span className="text-red-400">Fehler</span>}</p>
        </div>

        {/* Test Results */}
        <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">API Tests</h2>
          <div className="space-y-3">
            {testResults.map((test: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg ${test.error ? 'bg-red-500/10' : test.totalEvents > 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{test.name}</span>
                  {test.error ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : test.totalEvents > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                {test.error ? (
                  <p className="text-red-400 text-sm mt-1">{test.error}</p>
                ) : (
                  <p className="text-white/60 text-sm mt-1">
                    Status: {test.status} | Events: {test.totalEvents} (Seite: {test.eventsCount})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sample Events */}
        {sampleEvents.length > 0 && (
          <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Beispiel Events (erster Test)</h2>
            <div className="space-y-3">
              {sampleEvents.map((e: any, i: number) => (
                <div key={i} className="p-4 bg-black/50 rounded-lg">
                  <p className="text-white font-medium">{e.title}</p>
                  <p className="text-white/50 text-sm">Organizer: {e.organizerName}</p>
                  <p className={`text-sm font-mono ${e.organizerId === organizerId ? 'text-green-400 font-bold' : 'text-yellow-400'}`}>
                    Organizer ID: {e.organizerId} {e.organizerId === organizerId && '← DEINE ID!'}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{e.begin}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Organizers */}
        {allOrganizers.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Alle Organizer in den Events</h2>
            <ul className="space-y-2 text-sm">
              {allOrganizers.map((org: string, i: number) => (
                <li 
                  key={i} 
                  className={`p-3 rounded-lg ${org.includes(organizerId) ? 'bg-green-500/20 border border-green-500/30' : 'bg-black/30'}`}
                >
                  <span className={org.includes(organizerId) ? 'text-green-400 font-medium' : 'text-white/70'}>
                    {org}
                  </span>
                  {org.includes(organizerId) && <span className="ml-2 text-green-400">✓ DEINE ID</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Results */}
        {sampleEvents.length === 0 && allOrganizers.length === 0 && (
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 font-medium">Keine Events gefunden!</p>
            <p className="text-yellow-400/70 text-sm mt-2">
              Mögliche Ursachen:
            </p>
            <ul className="list-disc list-inside text-yellow-400/50 text-sm mt-1 space-y-1">
              <li>Der API Key hat keine Berechtigung für öffentliche Events</li>
              <li>Es gibt keine Events in der Schweiz (country=CH)</li>
              <li>Der API Key ist auf einen bestimmten Organizer beschränkt</li>
              <li>Die Events sind nicht öffentlich zugänglich</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={runTest}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Tests wiederholen
          </button>
          <a
            href="https://eventfrog.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Eventfrog öffnen
          </a>
        </div>
      </div>
    </div>
  )
}
