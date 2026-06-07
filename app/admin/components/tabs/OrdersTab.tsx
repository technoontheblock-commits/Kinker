'use client'

import { motion } from 'framer-motion'
import { Package, Eye, X } from 'lucide-react'
import Image from 'next/image'

interface OrdersTabProps {
  orders: any[]
  orderFilter: string
  setOrderFilter: (f: string) => void
  selectedOrder: any
  setSelectedOrder: (o: any) => void
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-500'
    case 'processing': return 'bg-blue-500/20 text-blue-500'
    case 'shipped': return 'bg-purple-500/20 text-purple-500'
    case 'pending': return 'bg-yellow-500/20 text-yellow-500'
    case 'cancelled': return 'bg-red-500/20 text-red-500'
    default: return 'bg-white/10 text-white/60'
  }
}

export default function OrdersTab({ orders, orderFilter, setOrderFilter, selectedOrder, setSelectedOrder, updateOrderStatus }: OrdersTabProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Orders</h2>
          <div className="flex items-center gap-3">
            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-white/60 text-sm">Total Orders</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-yellow-500">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-white/60 text-sm">Pending</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-blue-500">{orders.filter(o => o.status === 'processing').length}</p>
            <p className="text-white/60 text-sm">Processing</p>
          </div>
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-green-500">
              CHF {orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
            </p>
            <p className="text-white/60 text-sm">Total Revenue</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Order Number</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Date</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Total</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Status</th>
                  <th className="px-4 py-3 text-left text-white/60 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders
                  .filter(order => orderFilter === 'all' || order.status === orderFilter)
                  .map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-sm">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{order.customer_name || order.customer_email}</p>
                        <p className="text-white/40 text-xs">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-sm">
                        {new Date(order.created_at).toLocaleDateString('de-CH')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-semibold">CHF {(order.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-white/60 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.filter(order => orderFilter === 'all' || order.status === orderFilter).length === 0 && (
            <div className="text-center py-12 text-white/40">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Bestellung Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-1">Order ID</p>
                  <p className="text-white font-mono">{selectedOrder.id}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-1">Datum</p>
                  <p className="text-white">{new Date(selectedOrder.created_at).toLocaleString('de-CH')}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Kunde</h3>
                <p className="text-white">{selectedOrder.customer_name}</p>
                <p className="text-white/60">{selectedOrder.customer_email}</p>
                {selectedOrder.shipping_address && (
                  <div className="mt-3 text-white/60 text-sm">
                    <p>{selectedOrder.shipping_address.street}</p>
                    <p>{selectedOrder.shipping_address.zip} {selectedOrder.shipping_address.city}</p>
                    <p>{selectedOrder.shipping_address.country}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-white font-semibold mb-3">Artikel</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover rounded" />
                        )}
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-white/60 text-sm">Qty: {item.quantity} {item.size && `• ${item.size}`}</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold">CHF {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Zwischensumme</span>
                  <span className="text-white">CHF {(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60">Versand</span>
                  <span className="text-white">CHF {(selectedOrder.shipping || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white text-xl font-bold">CHF {(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-4 pt-4">
                <span className="text-white/60">Status ändern:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder.id, e.target.value)
                    setSelectedOrder({ ...selectedOrder, status: e.target.value })
                  }}
                  className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="pending">Ausstehend</option>
                  <option value="processing">In Bearbeitung</option>
                  <option value="shipped">Versendet</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="cancelled">Storniert</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
