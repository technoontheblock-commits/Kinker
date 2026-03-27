'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, Search, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId: string, paymentMethod: string) => {
    try {
      setVerifyingId(orderId)
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: paymentMethod,
          notes: `Payment verified via admin panel - ${new Date().toISOString()}`
        })
      })

      if (res.ok) {
        // Refresh orders
        loadOrders()
      } else {
        alert('Failed to verify payment')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      alert('Error verifying payment')
    } finally {
      setVerifyingId(null)
    }
  }

  const filteredOrders = orders
    .filter(order => {
      if (filter === 'pending') return order.payment_status === 'pending'
      if (filter === 'paid') return order.payment_status === 'paid'
      return true
    })
    .filter(order => 
      searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-CH')
  }

  const formatPrice = (price: number) => {
    return `CHF ${price.toFixed(2)}`
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Payment Verification</h1>
            <p className="text-white/60 mt-1">Verify TWINT and other pending payments</p>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'pending', 'paid'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  filter === f
                    ? 'bg-red-500 text-white'
                    : 'bg-neutral-800 text-white/70 hover:bg-neutral-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder:text-white/40"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-neutral-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Order</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Method</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-white/60 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="text-white font-mono text-sm">{order.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{order.customer_name}</p>
                      <p className="text-white/50 text-xs">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{formatPrice(order.total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/70 text-sm capitalize">{order.payment_method}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-500'
                        : order.payment_status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/50 text-sm">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {order.payment_status === 'pending' ? (
                      <button
                        onClick={() => verifyPayment(order.id, order.payment_method)}
                        disabled={verifyingId === order.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm rounded-lg"
                      >
                        {verifyingId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Verify
                      </button>
                    ) : (
                      <span className="text-green-500 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/40">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
