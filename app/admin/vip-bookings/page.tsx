'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Calendar, 
  User, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  Wine,
  GlassWater,
  Beer
} from 'lucide-react'
import Link from 'next/link'

interface VIPBooking {
  id: string
  user_id: string
  event_id: string
  package: 'Bronze' | 'Silver' | 'Gold'
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
    email: string
  }
  event: {
    id: string
    name: string
    date: string
  }
}

const packageIcons = {
  Bronze: <Wine className="w-4 h-4" />,
  Silver: <GlassWater className="w-4 h-4" />,
  Gold: <Beer className="w-4 h-4" />
}

const packageColors = {
  Bronze: 'bg-amber-700/20 text-amber-500 border-amber-500/30',
  Silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  Gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  approved: 'bg-green-500/20 text-green-500',
  rejected: 'bg-red-500/20 text-red-500'
}

export default function VIPBookingsAdminPage() {
  const [bookings, setBookings] = useState<VIPBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/vip-bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load bookings' })
      }
    } catch (error) {
      console.error('Error loading VIP bookings:', error)
      setMessage({ type: 'error', text: 'Error loading bookings' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setUpdating(bookingId)
    setMessage(null)

    try {
      const res = await fetch(`/api/vip-bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        const updatedBooking = await res.json()
        setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b))
        setMessage({ type: 'success', text: `Booking ${newStatus} successfully` })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update status' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating status' })
    } finally {
      setUpdating(null)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      const res = await fetch(`/api/vip-bookings/${bookingId}`, { method: 'DELETE' })

      if (res.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId))
        setMessage({ type: 'success', text: 'Booking deleted successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete booking' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting booking' })
    }
  }

  const filteredBookings = bookings.filter(b => 
    filter === 'all' ? true : b.status === filter
  )

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">VIP Bookings</h1>
              <p className="text-white/60">Manage VIP room booking requests</p>
            </div>
            <button
              onClick={loadBookings}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                : 'bg-red-500/20 text-red-500 border border-red-500/30'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-white/60 text-sm">Total Bookings</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-white/60 text-sm">Pending</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <div className="text-white/60 text-sm">Approved</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-white/60 text-sm">Rejected</div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === status
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-900 text-white/60 hover:bg-zinc-800'
              }`}
            >
              {status}
            </button>
          ))}
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden"
        >
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Crown className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="text-left text-white/60 font-medium px-6 py-4">User</th>
                    <th className="text-left text-white/60 font-medium px-6 py-4">Event</th>
                    <th className="text-left text-white/60 font-medium px-6 py-4">Package</th>
                    <th className="text-left text-white/60 font-medium px-6 py-4">Status</th>
                    <th className="text-left text-white/60 font-medium px-6 py-4">Date</th>
                    <th className="text-left text-white/60 font-medium px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-white/10">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{booking.user?.name || 'Unknown'}</div>
                          <div className="text-white/40 text-sm">{booking.user?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-500" />
                          <div>
                            <div className="text-white">{booking.event?.name || 'Unknown Event'}</div>
                            <div className="text-white/40 text-sm">
                              {new Date(booking.event?.date).toLocaleDateString('de-CH')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${packageColors[booking.package]}`}>
                          {packageIcons[booking.package]}
                          {booking.package}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusColors[booking.status]}`}>
                          {booking.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                          {booking.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {booking.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{booking.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.created_at).toLocaleString('de-CH')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Status Actions */}
                          {booking.status !== 'approved' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'approved')}
                              disabled={updating === booking.id}
                              className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              {updating === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {booking.status !== 'rejected' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'rejected')}
                              disabled={updating === booking.id}
                              className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {booking.status !== 'pending' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'pending')}
                              disabled={updating === booking.id}
                              className="p-2 text-yellow-500 hover:bg-yellow-500/20 rounded-lg transition-colors"
                              title="Set to Pending"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Package Details Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-zinc-900 rounded-xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-6">Package Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wine className="w-5 h-5 text-amber-500" />
                <h3 className="text-amber-500 font-bold">Bronze</h3>
              </div>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• VIP Room</li>
                <li>• Sekt</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-800/50 border border-gray-400/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <GlassWater className="w-5 h-5 text-gray-300" />
                <h3 className="text-gray-300 font-bold">Silver</h3>
              </div>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• VIP Room</li>
                <li>• Sekt</li>
                <li>• Softdrinks</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Beer className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 font-bold">Gold</h3>
              </div>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• VIP Room</li>
                <li>• Sekt</li>
                <li>• Softdrinks</li>
                <li>• 2 bottles of vodka</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
