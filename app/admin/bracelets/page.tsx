'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatChf, formatNfcUidForDisplay } from '@/lib/bar'
import { Loader2, Plus, Lock, Unlock, RefreshCw, Banknote, Search } from 'lucide-react'

interface Bracelet {
  id: string
  nfc_uid: string
  balance: number
  currency: string
  status: 'active' | 'disabled' | 'lost' | 'refunded' | 'void'
  event_id: string | null
  note: string | null
  created_at: string
}

export default function BraceletsAdminPage() {
  const [bracelets, setBracelets] = useState<Bracelet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [replaceOld, setReplaceOld] = useState('')
  const [replaceNew, setReplaceNew] = useState('')
  const [replaceLoading, setReplaceLoading] = useState(false)

  const loadBracelets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bracelets')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setBracelets(data.bracelets || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBracelets()
  }, [loadBracelets])

  const handleBulkImport = async () => {
    const uids = bulkInput
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (uids.length === 0) return

    setBulkLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bracelets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcUids: uids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import fehlgeschlagen')
      setBulkInput('')
      await loadBracelets()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/bracelets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update fehlgeschlagen')
      await loadBracelets()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReplace = async () => {
    if (!replaceOld || !replaceNew) return
    setReplaceLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/bracelets/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldNfcUid: replaceOld, newNfcUid: replaceNew }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ersatz fehlgeschlagen')
      setReplaceOld('')
      setReplaceNew('')
      setReplaceOpen(false)
      await loadBracelets()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReplaceLoading(false)
    }
  }

  const handleRefund = async (nfcUid: string) => {
    if (!confirm('Restguthaben wirklich zurückerstatten?')) return
    setError(null)
    try {
      const res = await fetch('/api/admin/bracelets/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcUid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Rückerstattung fehlgeschlagen')
      await loadBracelets()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filtered = bracelets.filter(b =>
    b.nfc_uid.toLowerCase().includes(filter.toLowerCase()) ||
    (b.note && b.note.toLowerCase().includes(filter.toLowerCase()))
  )

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    disabled: 'text-red-400 bg-red-400/10',
    lost: 'text-orange-400 bg-orange-400/10',
    refunded: 'text-blue-400 bg-blue-400/10',
    void: 'text-white/40 bg-white/5',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Armbänder</h1>
        <span className="text-white/50">{bracelets.length} Armbänder</span>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {/* Bulk import */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Armbänder importieren
        </h2>
        <p className="text-white/50 text-sm mb-3">
          NFC-UIDs einzeln, mit Komma oder Zeilenumbruch getrennt eingeben.
        </p>
        <textarea
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          placeholder="A1:B2:C3:D4&#10;E5:F6:G7:H8"
          className="w-full h-24 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 font-mono text-sm mb-3"
        />
        <button
          onClick={handleBulkImport}
          disabled={bulkLoading || !bulkInput.trim()}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
        >
          {bulkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Importieren'}
        </button>
      </div>

      {/* Replace */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Armband ersetzen
        </h2>
        {!replaceOpen ? (
          <button
            onClick={() => setReplaceOpen(true)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
          >
            Verlorenes Armband ersetzen
          </button>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Alte NFC-UID"
              value={replaceOld}
              onChange={e => setReplaceOld(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 font-mono"
            />
            <input
              type="text"
              placeholder="Neue NFC-UID"
              value={replaceNew}
              onChange={e => setReplaceNew(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 font-mono"
            />
            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={handleReplace}
                disabled={replaceLoading || !replaceOld || !replaceNew}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
              >
                {replaceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guthaben übertragen'}
              </button>
              <button
                onClick={() => setReplaceOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Armbänder filtern..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">NFC-UID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Guthaben</th>
                <th className="px-4 py-3">Notiz</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(b => (
                <tr key={b.id} className="text-white/80">
                  <td className="px-4 py-3 font-mono">{formatNfcUidForDisplay(b.nfc_uid)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${statusColors[b.status] || statusColors.void}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display font-bold">{formatChf(Number(b.balance))}</td>
                  <td className="px-4 py-3 text-white/50">{b.note || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === 'active' ? (
                        <button
                          onClick={() => updateStatus(b.id, 'disabled')}
                          title="Sperren"
                          className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : b.status === 'disabled' ? (
                        <button
                          onClick={() => updateStatus(b.id, 'active')}
                          title="Aktivieren"
                          className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg text-white/70 hover:text-green-400 transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : null}
                      {b.status === 'active' && Number(b.balance) > 0 && (
                        <button
                          onClick={() => handleRefund(b.nfc_uid)}
                          title="Restguthaben erstatten"
                          className="p-2 bg-white/5 hover:bg-blue-500/20 rounded-lg text-white/70 hover:text-blue-400 transition-colors"
                        >
                          <Banknote className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                    Keine Armbänder gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
