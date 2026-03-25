'use client'

import { useState, useEffect } from 'react'
import { Ticket, Calendar, QrCode, Download } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setTickets([
      {
        id: 'T-2024-001-A',
        event: 'TECHNO TUESDAY',
        date: '2024-04-15',
        time: '23:00',
        location: 'KINKER Basel',
        status: 'valid',
        qr_code: 'KINKER-xxx-yyy'
      },
    ])
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
        <p className="text-white/60">Manage your event tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{ticket.event}</h3>
                <p className="text-white/60">{ticket.location}</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">{ticket.status}</span>
            </div>

            <div className="flex items-center gap-4 text-white/60 mb-6">
              <Calendar className="w-4 h-4" />
              <span>{new Date(ticket.date).toLocaleDateString('de-CH')}</span>
              <span>{ticket.time}</span>
            </div>

            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center">
                <QrCode className="w-32 h-32 text-black" />
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No tickets yet</p>
        </div>
      )}
    </div>
  )
}
