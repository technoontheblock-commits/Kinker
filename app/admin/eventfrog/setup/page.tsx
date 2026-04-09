'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Loader2, AlertCircle } from 'lucide-react'

interface Organizer {
  id: string
  name: string
}

export default function EventfrogSetupPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadOrganizers()
  }, [])

  const loadOrganizers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/eventfrog/organizers')
      
      if (!res.ok) {
        throw new Error('Failed to load organizers')
      }
      
      const data = await res.json()
      setOrganizers(data.organizers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/admin/eventfrog"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Eventfrog Setup</h1>
            <p className="text-white/50">Finde deine Organisator ID</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Wo finde ich meine Organisator ID?</h2>
          
          <div className="space-y-4 text-white/70">
            <div className="flex gap-3">
              <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
              <p>Gehe zu <a href="https://eventfrog.ch" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">eventfrog.ch</a> und logge dich ein</p>
            </div>
            <div className="flex gap-3">
              <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
              <p>Klicke auf <strong>"Mein Profil"</strong> oder <strong>"Organisation"</strong></p>
            </div>
            <div className="flex gap-3">
              <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
              <p>Die Organisator ID steht unter <strong>"API & Integration"</strong> oder im Profil</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>Alternative:</strong> Schau in der URL deiner Eventfrog-Veranstalterseite. 
              Die ID ist die Zahl am Ende: <code>eventfrog.ch/o/kinker-basel-12345</code>
            </p>
          </div>
        </div>

        {/* Found Organizers */}
        <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Gefundene Organisatoren</h2>
            <p className="text-white/50 text-sm">Diese Organisatoren wurden in deinen Events gefunden</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              {error}
            </div>
          ) : organizers.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              Keine Organisatoren gefunden
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {organizers.map((org) => (
                <div key={org.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
                  <div>
                    <div className="font-medium text-white">{org.name}</div>
                    <div className="text-sm text-white/50 font-mono">ID: {org.id}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(org.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    {copied === org.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopieren
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Manuell eintragen</h2>
          <p className="text-white/60 mb-4">
            Füge die Organisator ID in deine <code>.env.local</code> Datei ein:
          </p>
          <div className="bg-black rounded-lg p-4 font-mono text-sm text-white/80">
            <div className="text-green-500"># Eventfrog Configuration</div>
            <div>EVENTFROG_API_KEY=ef_live_...</div>
            <div className="text-yellow-400">EVENTFROG_ORGANIZER_ID=deine_id_hier</div>
          </div>
        </div>
      </div>
    </div>
  )
}
