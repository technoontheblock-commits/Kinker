'use client'

import { motion } from 'framer-motion'
import { Users, Bell, Briefcase, Calendar, Crown } from 'lucide-react'

interface DashboardTabProps {
  users: any[]
  unreadCount: number
  jobs: any[]
  events: any[]
  notifications: any[]
  vipBookings: any[]
}

export default function DashboardTab({ users, unreadCount, jobs, events, notifications, vipBookings }: DashboardTabProps) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const eventsThisMonth = events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  }).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">{users.length}</span>
          </div>
          <p className="text-white/60">Total Users</p>
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Bell className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">{unreadCount}</span>
          </div>
          <p className="text-white/60">Unread Notifications</p>
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">{jobs.filter(j => j.status === 'Active').length}</span>
          </div>
          <p className="text-white/60">Active Jobs</p>
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">{eventsThisMonth}</span>
          </div>
          <p className="text-white/60">Events This Month</p>
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Crown className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">{vipBookings.filter(b => b.status === 'pending').length}</span>
          </div>
          <p className="text-white/60">Pending VIP Bookings</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {notifications.slice(0, 5).map((notif: any) => (
            <div key={notif.id} className="flex items-start gap-4 p-4 bg-black/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-white/30' : 'bg-red-500'}`} />
              <div className="flex-1">
                <p className="text-white font-medium">{notif.title}</p>
                <p className="text-white/60 text-sm">{notif.message}</p>
                <p className="text-white/40 text-xs mt-1">{notif.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
