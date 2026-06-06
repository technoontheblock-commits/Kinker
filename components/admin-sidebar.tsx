'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Bell,
  Briefcase,
  Home,
  Mail,
  CreditCard,
  MessageSquare,
  Crown,
  Layout,
  Disc,
  Code,
  ShoppingBag,
  Package,
  LogOut,
  ScanLine,
  Printer,
} from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/admin' },
  { id: 'users', label: 'User Management', icon: Users, href: '/admin' },
  { id: 'bonuscards', label: 'Memberships', icon: CreditCard, href: '/admin/memberships' },
  { id: 'scanner', label: 'Scanner', icon: ScanLine, href: '/scanner' },
  { id: 'vip-bookings', label: 'VIP Bookings', icon: Crown, href: '/admin/vip-bookings' },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell, href: '/admin' },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
  { id: 'careers', label: 'Careers', icon: Briefcase, href: '/admin' },
  { id: 'merchandise', label: 'Merch', icon: ShoppingBag, href: '/admin' },
  { id: 'orders', label: 'Bestellungen', icon: Package, href: '/admin' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, href: '/admin/forum' },
  { id: 'board', label: 'Board', icon: Layout, href: '/admin/board' },
  { id: 'advertising', label: 'Werbung', icon: Printer, href: '/admin/advertising' },
  { id: 'dj-roster', label: 'DJ Roster', icon: Disc, href: '/admin' },
  { id: 'developer', label: 'Developer', icon: Code, href: '/admin' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          const unread = (data || []).filter((n: any) => !n.read).length
          setUnreadCount(unread)
        }
      } catch {
        // ignore
      }
    }
    loadNotifications()
  }, [])

  // Check if a tab is active based on current pathname
  const isActive = (tab: typeof tabs[0]) => {
    if (tab.href === '/admin' && pathname === '/admin') return true
    if (tab.href !== '/admin' && pathname.startsWith(tab.href)) return true
    return false
  }

  return (
    <aside className="w-64 bg-neutral-900 h-[calc(100vh-5rem)] fixed left-0 top-20 border-r border-white/10 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-red-500/20 text-red-500'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-white/10 mt-auto">
        <button
          onClick={async () => {
            await fetch('/api/auth/session', { method: 'DELETE' })
            window.location.href = '/'
          }}
          className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
