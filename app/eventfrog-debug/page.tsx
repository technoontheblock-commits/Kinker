'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function EventfrogDebugPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [eventsResult, setEventsResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    try {
      setLoading(true)
      
      // Test 1: Generic API test
      const testRes = await fetch('/api/eventfrog/test')
      const testData = await testRes.json()
      setTestResult({ status: testRes.status, data: testData })
      
      // Test 2: Events with organizer filter
      const eventsRes = await fetch('/api/eventfrog/events')
      const eventsData = await eventsRes.json()
      setEventsResult({ status: eventsRes.status, data: eventsData })
      
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

        {/* Test 1: Generic API */}
        <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            {testResult?.status === 200 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            Test 1: API Verbindung (ohne Filter)
          </h2>
          
          {testResult?.data?.error ? (
            <div className="text-red-400">{testResult.data.error}</div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-white/70">Status: <span className={testResult?.status === 200 ? 'text-green-400' : 'text-red-400'}>{testResult?.status}</span></p>
              <p className="text-white/70">Gefundene Events: {testResult?.data?.totalEvents || 0}</p>
              
              {testResult?.data?.sampleEvents?.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/50 mb-2">Beispiel Events:</p>
                  <div className="space-y-2">
                    {testResult.data.sampleEvents.map((e: any, i: number) => (
                      <div key={i} className="p-3 bg-black/50 rounded text-xs">
                        <p className="text-white">{e.title}</p>
                        <p className="text-white/50">Organizer: {e.organizerName}</p>
                        <p className="text-yellow-400">Organizer ID: {e.organizerId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {testResult?.data?.allOrganizers?.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/50 mb-2">Alle Organizer in den Events:</p>
                  <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                    {testResult.data.allOrganizers.map((org: string, i: number) => (
                      <li key={i} className={org.includes('7402869873452305017') ? 'text-green-400 font-medium' : ''}>
                        {org}
                        {org.includes('7402869873452305017') && ' ← DEINE ID'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test 2: With Organizer Filter */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            {eventsResult?.status === 200 && eventsResult?.data?.events?.length > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Test 2: API mit Organizer Filter
          </h2>
          
          <div className="space-y-2 text-sm">
            <p className="text-white/70">Status: <span className="text-white">{eventsResult?.status}</span></p>
            <p className="text-white/70">Organizer ID: {eventsResult?.data?.debug?.organizerId || 'Nicht gesetzt'}</p>
            <p className="text-white/70">API Total: {eventsResult?.data?.debug?.totalFromApi}</p>
            <p className="text-white/70">Zurückgegeben: {eventsResult?.data?.debug?.returnedCount}</p>
            
            {eventsResult?.data?.events?.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400">Keine Events mit diesem Organizer gefunden.</p>
                <p className="text-yellow-400/70 text-sm mt-2">
                  Mögliche Ursachen:
                </p>
                <ul className="list-disc list-inside text-yellow-400/50 text-sm mt-1">
                  <li>Die Organizer ID ist falsch</li>
                  <li>Es gibt keine Events mit diesem Organizer in der Zukunft</li>
                  <li>Die Events sind nicht öffentlich/publiziert</li>
                  <li>Die Events liegen in der Vergangenheit</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={runTests}
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
