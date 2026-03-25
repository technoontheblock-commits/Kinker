'use client'

import { useState, useEffect } from 'react'
import { Package, Eye, Loader2, X, MapPin, CreditCard, Calendar, User, Mail, Phone } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  is_ticket: boolean
}

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  payment_method: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: any
  billing_address: any
  items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders/user')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500'
      case 'shipped': return 'bg-blue-500/20 text-blue-500'
      case 'processing': return 'bg-yellow-500/20 text-yellow-500'
      case 'pending': return 'bg-orange-500/20 text-orange-500'
      default: return 'bg-white/10 text-white/60'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'shipped': return 'Shipped'
      case 'processing': return 'Processing'
      case 'pending': return 'Payment Pending'
      default: return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'twint': return 'TWINT'
      case 'bank_transfer': return 'Bank Transfer'
      case 'cash': return 'Cash on Site'
      case 'invoice': return 'Invoice'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
        <p className="text-white/60">View your order history</p>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
        {orders.length > 0 ? (
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
                  <td className="px-6 py-4 text-white font-medium">{order.order_number}</td>
                  <td className="px-6 py-4 text-white/60">{new Date(order.created_at).toLocaleDateString('de-CH')}</td>
                  <td className="px-6 py-4 text-white/60">
                    {order.items?.length > 0 
                      ? `${order.items.length} Artikel` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-white">CHF {order.total?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-white/60 hover:text-white"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No orders yet</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Order {selectedOrder.order_number}</h2>
                <p className="text-white/60 text-sm mt-1">
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
                <span className="text-white/60 text-sm">
                  Payment: {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              {/* Order Items */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-500" />
                  Items
                </h3>
                {selectedOrder.items?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div>
                          <p className="text-white">{item.name}</p>
                          <p className="text-white/60 text-sm">{item.quantity}x</p>
                        </div>
                        <p className="text-white font-medium">CHF {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40">No items</p>
                )}
              </div>

              {/* Totals */}
              <div className="bg-black/30 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>CHF {selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>CHF {selectedOrder.shipping_cost?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>CHF {selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  Payment Method
                </h3>
                <p className="text-white">{getPaymentMethodLabel(selectedOrder.payment_method)}</p>
              </div>

              {/* Addresses */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedOrder.shipping_address && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-500" />
                      Shipping Address
                    </h3>
                    <div className="text-white/80 text-sm space-y-1">
                      <p>{selectedOrder.shipping_address.street}</p>
                      <p>{selectedOrder.shipping_address.zip} {selectedOrder.shipping_address.city}</p>
                      <p>{selectedOrder.shipping_address.country}</p>
                    </div>
                  </div>
                )}
                
                {selectedOrder.billing_address && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-red-500" />
                      Billing Address
                    </h3>
                    <div className="text-white/80 text-sm space-y-1">
                      <p>{selectedOrder.billing_address.street}</p>
                      <p>{selectedOrder.billing_address.zip} {selectedOrder.billing_address.city}</p>
                      <p>{selectedOrder.billing_address.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-white/40" />
                    {selectedOrder.customer_name}
                  </p>
                  <p className="text-white/80 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white/40" />
                    {selectedOrder.customer_email}
                  </p>
                  {selectedOrder.customer_phone && (
                    <p className="text-white/80 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-white/40" />
                      {selectedOrder.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
