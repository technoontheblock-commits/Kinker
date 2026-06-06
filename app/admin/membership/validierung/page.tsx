'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Printer, Plus, QrCode, Copy, CheckCircle, XCircle, Clock } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'
import QRCode from 'qrcode'

interface Claim {
  id: string
  token: string
  created_at: string
  expires_at: string
  claimed_at: string | null
  claimed_by: { name: string; email: string } | null
  bonus_cards: { card_number: string; holder_name: string } | null
}

export default function AdminMembershipValidationPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadClaims()
  }, [])

  useEffect(() => {
    if (activeClaim) {
      const claimUrl = `${window.location.origin}/membership/claim?token=${activeClaim.token}`
      QRCode.toDataURL(claimUrl, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(setQrDataUrl)
        .catch(console.error)
    }
  }, [activeClaim])

  const loadClaims = async () => {
    try {
      const res = await fetch('/api/membership/claims')
      if (res.ok) {
        const data = await res.json()
        setClaims(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createClaim = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/membership/claims', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.claim) {
          setActiveClaim(data.claim)
          loadClaims()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const copyUrl = () => {
    if (activeClaim) {
      navigator.clipboard.writeText(`${window.location.origin}/membership/claim?token=${activeClaim.token}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const isExpired = (claim: Claim) => !claim.claimed_at && new Date(claim.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-black pt-20">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Membership Validierung</h1>
            <button
              onClick={createClaim}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {creating ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Neuen Claim-QR erstellen
            </button>
          </div>

          {/* Active Claim Modal */}
          {activeClaim && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
              <div className="bg-neutral-900 rounded-2xl border border-white/10 p-8 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Neuer Claim-QR</h2>
                  <button onClick={() => setActiveClaim(null)} className="text-white/40 hover:text-white">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <img src="/images/logo.png" alt="KINKER" width={100} className="mb-2" />
                  <h3 className="text-2xl font-bold text-white">KINKER <span className="text-red-500">MEMBERSHIP</span></h3>
                  <p className="text-white/60 text-sm text-center">Scanne den QR-Code, um deine Membership zu beanspruchen.</p>
                  
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 rounded-xl border-4 border-white/10" />
                  )}
                  
                  <p className="text-white/40 text-xs text-center break-all px-4">
                    {typeof window !== 'undefined' && window.location.origin}/membership/claim?token={activeClaim.token}
                  </p>
                  <p className="text-white/40 text-xs">Gültig bis: {new Date(activeClaim.expires_at).toLocaleString('de-CH')}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={copyUrl}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Kopiert' : 'URL kopieren'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    PDF / Drucken
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Print-only area */}
          {activeClaim && qrDataUrl && (
            <div className="print-only hidden">
              <div className="flex flex-col items-center justify-center gap-8 py-16">
                <img src="/images/logo.png" alt="KINKER" width={140} />
                <h1 className="text-4xl font-bold text-black">KINKER <span className="text-red-600">MEMBERSHIP</span></h1>
                <p className="text-black/60 text-base text-center">Scanne den QR-Code, um deine Membership zu beanspruchen.</p>
                <img src={qrDataUrl} alt="QR Code" className="w-72 h-72" />
                <p className="text-black/40 text-sm text-center break-all px-8">
                  {typeof window !== 'undefined' && window.location.origin}/membership/claim?token={activeClaim.token}
                </p>
                <p className="text-black/40 text-sm">Gültig bis: {new Date(activeClaim.expires_at).toLocaleString('de-CH')}</p>
              </div>
            </div>
          )}

          {/* Claims List */}
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Token</th>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Erstellt</th>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Gültig bis</th>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Status</th>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Eingelöst von</th>
                  <th className="text-left text-white/60 font-medium px-6 py-4">Karte</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-t border-white/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-red-500" />
                        <span className="text-white font-mono text-sm">{claim.token.slice(0, 16)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm">{new Date(claim.created_at).toLocaleString('de-CH')}</td>
                    <td className="px-6 py-4 text-white/60 text-sm">{new Date(claim.expires_at).toLocaleString('de-CH')}</td>
                    <td className="px-6 py-4">
                      {claim.claimed_at ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Eingelöst
                        </span>
                      ) : isExpired(claim) ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs bg-red-400/10 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Abgelaufen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Aktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm">{claim.claimed_by?.name || '-'}</td>
                    <td className="px-6 py-4 text-white/60 text-sm">{claim.bonus_cards?.card_number || '-'}</td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      Noch keine Claims erstellt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          body > div { display: none !important; }
          .print-only { display: block !important; }
          .print-only * { visibility: visible !important; }
        }
      `}</style>
    </div>
  )
}
