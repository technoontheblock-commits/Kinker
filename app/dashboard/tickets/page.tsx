'use client'

import { useState, useEffect } from 'react'
import { Ticket, Calendar, Download, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { TicketPDF, generateQRCodeDataURL } from './ticket-pdf'
import { TicketQRCode } from './qr-code'

interface TicketData {
  id: string
  ticket_number: string
  status: 'valid' | 'used' | 'cancelled'
  qr_data: string
  holder_name: string
  holder_email: string
  event: {
    name: string
    date: string
    time: string
    image: string
    venue: string
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tickets/user')
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please log in to view your tickets')
          return
        }
        throw new Error('Failed to load tickets')
      }
      const data = await res.json()
      console.log('API Response:', data)
      setTickets(data.tickets || [])
      setDebugInfo(data.debug)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = async (ticket: TicketData) => {
    try {
      setDownloadingId(ticket.id)
      
      // Generate QR code
      const qrCodeDataUrl = await generateQRCodeDataURL(ticket.qr_data)
      
      // Generate PDF
      const blob = await pdf(
        <TicketPDF 
          ticket={ticket} 
          qrCodeDataUrl={qrCodeDataUrl} 
        />
      ).toBlob()
      
      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KINKER-Ticket-${ticket.ticket_number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download ticket. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
          <p className="text-white/60">Manage your event tickets</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
          <p className="text-white/60">Manage your event tickets</p>
        </div>
        <div className="text-center py-16">
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
        <p className="text-white/60">Manage your event tickets</p>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-neutral-800 rounded-lg p-4 text-xs font-mono text-white/70">
          <h3 className="font-bold text-white mb-2">Debug Info:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{ticket.event.name}</h3>
                <p className="text-white/60">{ticket.event.venue || 'KINKER Basel'}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full ${
                ticket.status === 'valid' 
                  ? 'bg-green-500/20 text-green-500' 
                  : ticket.status === 'used'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {ticket.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-white/60 mb-6">
              <Calendar className="w-4 h-4" />
              <span>{new Date(ticket.event.date).toLocaleDateString('de-CH')}</span>
              <span>{ticket.event.time}</span>
            </div>

            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center">
                <TicketQRCode value={ticket.qr_data} size={128} />
              </div>
              <p className="text-center text-black/60 text-xs mt-2 font-mono truncate">{ticket.qr_data}</p>
            </div>

            <button 
              onClick={() => downloadTicket(ticket)}
              disabled={downloadingId === ticket.id}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg transition-colors"
            >
              {downloadingId === ticket.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Ticket PDF
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No tickets yet</p>
          <p className="text-white/30 text-sm mt-2">Purchase tickets to see them here</p>
        </div>
      )}
    </div>
  )
}
