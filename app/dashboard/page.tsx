'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Package, Gift, Calendar, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    tickets: 0,
    orders: 0,
    rewards: 0
  })
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load dashboard stats from API
      const dashboardRes = await fetch('/api/user/dashboard')
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        setStats({
          tickets: dashboardData.stats?.tickets || 0,
          orders: dashboardData.stats?.orders || 0,
          rewards: dashboardData.stats?.points || 0
        })
        setRecentTickets(dashboardData.recentTickets?.slice(0, 3) || [])
        setRecentOrders(dashboardData.recentOrders?.slice(0, 3) || [])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500'
      case 'shipped': return 'bg-purple-500/20 text-purple-500'
      case 'processing': return 'bg-blue-500/20 text-blue-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'cancelled': return 'bg-red-500/20 text-red-500'
      case 'valid': return 'bg-green-500/20 text-green-500'
      case 'used': return 'bg-gray-500/20 text-gray-500'
      default: return 'bg-white/10 text-white/60'
    }
  }

  const statCards = [
    { id: 'tickets', label: 'My Tickets', value: stats.tickets, icon: Ticket, color: 'red', href: '/dashboard/tickets' },
    { id: 'orders', label: 'Orders', value: stats.orders, icon: Package, color: 'blue', href: '/dashboard/orders' },
    { id: 'rewards', label: 'Rewards Points', value: stats.rewards, icon: Gift, color: 'green', href: '/dashboard/rewards' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Welcome back! Here is your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.id} href={stat.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-red-500" />
              My Tickets
            </h2>
            <Link href="/dashboard/tickets" className="text-red-500 hover:text-red-400 text-sm">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{ticket.event?.name || ticket.event_name || 'Event'}</p>
                  <p className="text-white/60 text-sm">
                    {new Date(ticket.event?.date || ticket.event_date).toLocaleDateString('de-CH')}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            ))}
            
            {recentTickets.length === 0 && (
              <p className="text-white/40 text-center py-8">No tickets yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Recent Orders
            </h2>
            <Link href="/dashboard/orders" className="text-red-500 hover:text-red-400 text-sm">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{order.order_number || order.id?.slice(0, 8)}</p>
                  <p className="text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString('de-CH')}</p>
                </div>
                <p className="text-white font-semibold">CHF {(order.total || 0).toFixed(2)}</p>
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))}
            
            {recentOrders.length === 0 && (
              <p className="text-white/40 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
