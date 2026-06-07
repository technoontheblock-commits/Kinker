'use client'

import { motion } from 'framer-motion'
import { Ticket, Eye, Ban, X, QrCode } from 'lucide-react'

interface TicketsTabProps {
  tickets: any[]
  ticketFilter: string
  setTicketFilter: (f: string) => void
  selectedTicket: any
  setSelectedTicket: (t: any) => void
  cancelTicket: (ticketId: string) => Promise<void>
  loadTickets: () => Promise<void>
}

export default function TicketsTab({ tickets, ticketFilter, setTicketFilter, selectedTicket, setSelectedTicket, cancelTicket, loadTickets }: TicketsTabProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Tickets</h2>
          <div className="flex items-center gap-3">
            <select
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Tickets</option>
              <option value="valid">Valid</option>
              <option value="used">Used</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{tickets.length}</p>
            <p className="text-white/60 text-sm">Total Tickets</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-green-500">{tickets.filter(t => t.status === 'valid').length}</p>
            <p className="text-white/60 text-sm">Valid</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-blue-500">{tickets.filter(t => t.status === 'used').length}</p>
            <p className="text-white/60 text-sm">Used</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-red-500">{tickets.filter(t => t.status === 'cancelled').length}</p>
            <p className="text-white/60 text-sm">Cancelled</p>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Ticket Number</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Event</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Date</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Ticket Status</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Payment</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets
                  .filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter)
                  .map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-sm">{ticket.ticket_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm">{ticket.event?.name || 'Unknown Event'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{ticket.holder_name}</p>
                        <p className="text-white/40 text-xs">{ticket.holder_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString('de-CH')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        ticket.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                        ticket.status === 'used' ? 'bg-blue-500/20 text-blue-500' :
                        ticket.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        ticket.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' :
                        ticket.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        ticket.payment_status === 'failed' ? 'bg-red-500/20 text-red-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {ticket.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 text-white/60 hover:text-blue-500 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ticket.status !== 'cancelled' && (
                          <button
                            onClick={() => cancelTicket(ticket.id)}
                            className="p-2 text-white/60 hover:text-red-500 transition-colors"
                            title="Cancel Ticket"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tickets.filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter).length === 0 && (
            <div className="text-center py-12 text-white/40">
              <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-xl p-5 max-w-sm w-full border border-white/10 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Ticket Details</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* QR Code - Compact */}
              <div className="bg-white rounded-lg p-3 flex flex-col items-center">
                <QrCode className="w-20 h-20 text-black" />
                <p className="text-black/60 text-[10px] mt-1 font-mono truncate max-w-full">{selectedTicket.qr_code}</p>
              </div>

              {/* Ticket Number */}
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-white/50 text-xs mb-0.5">Ticket Number</p>
                <p className="text-white font-mono text-sm">{selectedTicket.ticket_number}</p>
              </div>

              {/* Event & Customer - Side by side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs mb-0.5">Event</p>
                  <p className="text-white text-sm font-medium truncate">{selectedTicket.event?.name || 'Unknown'}</p>
                  <p className="text-white/40 text-[10px]">
                    {selectedTicket.event?.date && new Date(selectedTicket.event.date).toLocaleDateString('de-CH')}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs mb-0.5">Customer</p>
                  <p className="text-white text-sm font-medium truncate">{selectedTicket.holder_name}</p>
                  <p className="text-white/40 text-[10px] truncate">{selectedTicket.holder_email}</p>
                </div>
              </div>

              {/* Status - Side by side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs mb-1">Ticket</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    selectedTicket.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                    selectedTicket.status === 'used' ? 'bg-blue-500/20 text-blue-500' :
                    selectedTicket.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="bg-black/30 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs mb-1">Payment</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    selectedTicket.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' :
                    selectedTicket.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    selectedTicket.payment_status === 'failed' ? 'bg-red-500/20 text-red-500' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {selectedTicket.payment_status || 'pending'}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              {selectedTicket.order && (
                <div className="bg-black/30 rounded-lg p-2.5">
                  <p className="text-white/50 text-xs mb-1.5">Payment Info</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Method:</span>
                      <span className="text-white capitalize">{selectedTicket.order.payment_method?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Order Status:</span>
                      <span className={`capitalize ${
                        selectedTicket.order.status === 'completed' ? 'text-green-500' :
                        selectedTicket.order.status === 'pending' ? 'text-yellow-500' :
                        selectedTicket.order.status === 'failed' ? 'text-red-500' :
                        'text-white/60'
                      }`}>{selectedTicket.order.status || 'N/A'}</span>
                    </div>
                    {selectedTicket.order.total_amount && (
                      <div className="flex justify-between">
                        <span className="text-white/40">Amount:</span>
                        <span className="text-white">CHF {selectedTicket.order.total_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedTicket.order.payment_details?.reference && (
                      <div className="flex justify-between">
                        <span className="text-white/40">Reference:</span>
                        <span className="text-white font-mono text-[10px]">{selectedTicket.order.payment_details.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-white/50 text-xs mb-0.5">Created</p>
                <p className="text-white text-xs">
                  {new Date(selectedTicket.created_at).toLocaleString('de-CH')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {(selectedTicket.payment_status === 'pending' || !selectedTicket.payment_status) && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/tickets/admin/payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ticket_id: selectedTicket.id, status: 'paid' })
                        })
                        if (res.ok) {
                          setSelectedTicket({ ...selectedTicket, payment_status: 'paid' })
                          loadTickets()
                        } else {
                          const err = await res.json()
                          alert('Error: ' + (err.error || 'Failed to update'))
                        }
                      } catch (err) {
                        console.error('Error updating payment status:', err)
                        alert('Error updating payment status')
                      }
                    }}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Mark as Paid
                  </button>
                )}
                {selectedTicket.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      cancelTicket(selectedTicket.id)
                      setSelectedTicket(null)
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Cancel Ticket
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
