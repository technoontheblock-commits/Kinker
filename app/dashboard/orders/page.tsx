'use client'

import { useState, useEffect } from 'react'
import { Package, Eye } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setOrders([
      { id: 'KINK-2024-001', date: '2024-03-20', total: 89.90, status: 'completed', items: ['KINKER Hoodie'] },
      { id: 'KINK-2024-002', date: '2024-03-15', total: 39.90, status: 'shipped', items: ['KINKER T-Shirt'] },
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500'
      case 'shipped': return 'bg-blue-500/20 text-blue-500'
      case 'processing': return 'bg-yellow-500/20 text-yellow-500'
      default: return 'bg-white/10 text-white/60'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
        <p className="text-white/60">View your order history</p>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30">
            <tr>
              <th className="text-left text-white/60 font-medium px-6 py-4">Order</th>
              <th className="text-left text-white/60 font-medium px-6 py-4">Date</th>
              <th className="text-left text-white/60 font-medium px-6 py-4">Items</th>
              <th className="text-left text-white/60 font-medium px-6 py-4">Total</th>
              <th className="text-left text-white/60 font-medium px-6 py-4">Status</th>
              <th className="text-left text-white/60 font-medium px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10">
                <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                <td className="px-6 py-4 text-white/60">{new Date(order.date).toLocaleDateString('de-CH')}</td>
                <td className="px-6 py-4 text-white/60">{order.items.join(', ')}</td>
                <td className="px-6 py-4 text-white">CHF {order.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 text-white/60 hover:text-white">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
